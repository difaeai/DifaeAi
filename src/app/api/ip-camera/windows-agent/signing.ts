import { spawn } from "node:child_process";
import { constants as fsConstants, promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const SIGNING_CERT_PATH = cleanEnv(process.env.WINDOWS_AGENT_SIGNING_CERT_PATH);
const SIGNING_CERT_BASE64 = cleanEnv(
  process.env.WINDOWS_AGENT_SIGNING_CERT_BASE64,
);
const SIGNING_CERT_PASSWORD = cleanEnv(
  process.env.WINDOWS_AGENT_SIGNING_CERT_PASSWORD,
);
const SIGNING_DESCRIPTION =
  cleanEnv(process.env.WINDOWS_AGENT_SIGNING_DESCRIPTION) ??
  "Difae Camera Bridge";
const SIGNING_URL = cleanEnv(process.env.WINDOWS_AGENT_SIGNING_URL) ??
  "https://difae.ai";
const TIMESTAMP_URL = cleanEnv(
  process.env.WINDOWS_AGENT_SIGNING_TIMESTAMP_URL,
) ?? "http://timestamp.digicert.com";
const SIGNATURE_REQUIRED =
  cleanEnv(process.env.WINDOWS_AGENT_REQUIRE_SIGNING) !== "false";

type Signer = "signtool" | "osslsigncode";

interface SignerTool {
  type: Signer;
  command: string;
}

interface SigningContext {
  certificatePath: string;
  certificatePassword?: string;
  description: string;
  url: string;
  timestampUrl?: string;
}

interface CertificateHandle {
  path: string;
  cleanup: () => Promise<void>;
}

function cleanEnv(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

async function findExecutableOnPath(executable: string): Promise<string | null> {
  const pathEnv = process.env.PATH ?? "";
  if (!pathEnv) {
    return null;
  }

  const pathExtensions =
    process.platform === "win32"
      ? (process.env.PATHEXT?.split(";").filter(Boolean) ?? [".EXE", ".CMD", ".BAT", ".COM"])
      : [""];

  for (const dir of pathEnv.split(path.delimiter)) {
    if (!dir) {
      continue;
    }

    for (const ext of pathExtensions) {
      const candidate = path.join(
        dir,
        process.platform === "win32" ? `${executable}${ext}` : executable,
      );
      try {
        await fs.access(candidate, fsConstants.X_OK);
        return candidate;
      } catch {
        try {
          await fs.access(candidate, fsConstants.F_OK);
          return candidate;
        } catch {
          continue;
        }
      }
    }
  }

  return null;
}

async function resolveSignerTool(): Promise<SignerTool | null> {
  if (process.env.WINDOWS_AGENT_SIGNTOOL_PATH) {
    return { type: "signtool", command: process.env.WINDOWS_AGENT_SIGNTOOL_PATH };
  }

  if (process.env.WINDOWS_AGENT_OSSL_SIGNCODE_PATH) {
    return {
      type: "osslsigncode",
      command: process.env.WINDOWS_AGENT_OSSL_SIGNCODE_PATH,
    };
  }

  const signTool = await findExecutableOnPath(
    process.platform === "win32" ? "signtool" : "signtool",
  );
  if (signTool) {
    return { type: "signtool", command: signTool };
  }

  const osslSigncode = await findExecutableOnPath("osslsigncode");
  if (osslSigncode) {
    return { type: "osslsigncode", command: osslSigncode };
  }

  return null;
}

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code}`));
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

async function signWithSignTool(
  command: string,
  executablePath: string,
  context: SigningContext,
): Promise<void> {
  const args = ["sign", "/fd", "SHA256", "/f", context.certificatePath];

  if (context.certificatePassword) {
    args.push("/p", context.certificatePassword);
  }

  if (context.description) {
    args.push("/d", context.description);
  }

  if (context.url) {
    args.push("/du", context.url);
  }

  if (context.timestampUrl) {
    args.push("/tr", context.timestampUrl, "/td", "SHA256");
  }

  args.push(executablePath);

  await run(command, args);
}

async function signWithOsslsigncode(
  command: string,
  executablePath: string,
  context: SigningContext,
): Promise<void> {
  const tempDir = await fs.mkdtemp(path.join(tmpdir(), "difae-signed-"));
  const outputPath = path.join(tempDir, path.basename(executablePath));
  const args = [
    "sign",
    "-h",
    "sha256",
    "-n",
    context.description,
    "-i",
    context.url,
    "-pkcs12",
    context.certificatePath,
    "-in",
    executablePath,
    "-out",
    outputPath,
  ];

  if (context.certificatePassword) {
    args.push("-pass", context.certificatePassword);
  }

  if (context.timestampUrl) {
    args.push("-t", context.timestampUrl);
  }

  try {
    await run(command, args);
    await fs.copyFile(outputPath, executablePath);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function materialiseCertificate(): Promise<CertificateHandle | null> {
  if (SIGNING_CERT_PATH) {
    return {
      path: SIGNING_CERT_PATH,
      cleanup: async () => {},
    };
  }

  if (!SIGNING_CERT_BASE64) {
    return null;
  }

  const trimmed = SIGNING_CERT_BASE64.replace(/\s+/g, "");

  let buffer: Buffer;
  try {
    buffer = Buffer.from(trimmed, "base64");
  } catch {
    throw new SigningConfigurationError(
      "WINDOWS_AGENT_SIGNING_CERT_BASE64 is not valid base64-encoded data.",
    );
  }

  if (buffer.length === 0) {
    throw new SigningConfigurationError(
      "WINDOWS_AGENT_SIGNING_CERT_BASE64 decoded to an empty file.",
    );
  }

  const normalisedInput = trimmed.replace(/=+$/, "");
  const normalisedEncoded = buffer.toString("base64").replace(/=+$/, "");
  if (normalisedInput !== normalisedEncoded) {
    throw new SigningConfigurationError(
      "WINDOWS_AGENT_SIGNING_CERT_BASE64 could not be decoded (malformed padding or characters).",
    );
  }

  const tempDir = await fs.mkdtemp(path.join(tmpdir(), "difae-cert-"));
  const filePath = path.join(tempDir, "signing-cert.pfx");
  await fs.writeFile(filePath, buffer);

  return {
    path: filePath,
    cleanup: async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    },
  };
}

export class SigningConfigurationError extends Error {}

export async function maybeSignExecutable(
  executablePath: string,
): Promise<void> {
  const certificate = await materialiseCertificate();

  if (!certificate) {
    if (SIGNATURE_REQUIRED) {
      throw new SigningConfigurationError(
        "Code signing is required but no certificate was provided. Set WINDOWS_AGENT_SIGNING_CERT_PATH or WINDOWS_AGENT_SIGNING_CERT_BASE64.",
      );
    }

    console.warn(
      "Skipping Windows agent signing because no certificate configuration is present.",
    );
    return;
  }

  try {
    await fs.access(certificate.path);
  } catch {
    await certificate.cleanup();
    throw new SigningConfigurationError(
      `Signing certificate not found at ${certificate.path}. Ensure the certificate configuration is correct.`,
    );
  }

  const signer = await resolveSignerTool();

  if (!signer) {
    if (SIGNATURE_REQUIRED) {
      await certificate.cleanup();
      throw new SigningConfigurationError(
        "Code signing is required but no signing tool is available. Provide WINDOWS_AGENT_SIGNTOOL_PATH or install osslsigncode and expose it via WINDOWS_AGENT_OSSL_SIGNCODE_PATH.",
      );
    }

    console.warn(
      "Skipping Windows agent signing because no signing tool (signtool or osslsigncode) is available on the host.",
    );
    await certificate.cleanup();
    return;
  }

  const context: SigningContext = {
    certificatePath: certificate.path,
    certificatePassword: SIGNING_CERT_PASSWORD,
    description: SIGNING_DESCRIPTION ?? "",
    url: SIGNING_URL ?? "",
    timestampUrl: TIMESTAMP_URL ?? undefined,
  };

  try {
    if (signer.type === "signtool") {
      await signWithSignTool(signer.command, executablePath, context);
    } else {
      await signWithOsslsigncode(signer.command, executablePath, context);
    }
  } catch (error) {
    throw new Error("Failed to sign Windows agent executable.", {
      cause: error as Error,
    });
  } finally {
    await certificate.cleanup();
  }
}
