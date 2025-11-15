import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";

const SIGNING_CERT_PATH = process.env.WINDOWS_AGENT_SIGNING_CERT_PATH;
const SIGNING_CERT_PASSWORD = process.env.WINDOWS_AGENT_SIGNING_CERT_PASSWORD;
const SIGNING_DESCRIPTION =
  process.env.WINDOWS_AGENT_SIGNING_DESCRIPTION || "Difae Camera Bridge";
const SIGNING_URL = process.env.WINDOWS_AGENT_SIGNING_URL || "https://difae.ai";
const TIMESTAMP_URL =
  process.env.WINDOWS_AGENT_SIGNING_TIMESTAMP_URL ||
  "http://timestamp.digicert.com";

type Signer = "signtool" | "osslsigncode";

function resolveSigner(): Signer | null {
  if (!SIGNING_CERT_PATH) {
    return null;
  }

  if (process.env.WINDOWS_AGENT_SIGNTOOL_PATH) {
    return "signtool";
  }

  if (process.env.WINDOWS_AGENT_OSSL_SIGNCODE_PATH || process.env.PATH) {
    return "osslsigncode";
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

async function signWithSignTool(executablePath: string): Promise<void> {
  const toolPath = process.env.WINDOWS_AGENT_SIGNTOOL_PATH ?? "signtool";
  const args = [
    "sign",
    "/fd",
    "SHA256",
    "/f",
    SIGNING_CERT_PATH!,
  ];

  if (SIGNING_CERT_PASSWORD) {
    args.push("/p", SIGNING_CERT_PASSWORD);
  }

  if (SIGNING_DESCRIPTION) {
    args.push("/d", SIGNING_DESCRIPTION);
  }

  if (SIGNING_URL) {
    args.push("/du", SIGNING_URL);
  }

  if (TIMESTAMP_URL) {
    args.push("/tr", TIMESTAMP_URL, "/td", "SHA256");
  }

  args.push(executablePath);

  await run(toolPath, args);
}

async function signWithOsslsigncode(executablePath: string): Promise<void> {
  const tempDir = await mkdtemp(path.join(tmpdir(), "difae-signed-"));
  const outputPath = path.join(tempDir, path.basename(executablePath));
  const toolPath =
    process.env.WINDOWS_AGENT_OSSL_SIGNCODE_PATH ?? "osslsigncode";
  const args = [
    "sign",
    "-h",
    "sha256",
    "-n",
    SIGNING_DESCRIPTION,
    "-i",
    SIGNING_URL,
    "-pkcs12",
    SIGNING_CERT_PATH!,
    "-in",
    executablePath,
    "-out",
    outputPath,
  ];

  if (SIGNING_CERT_PASSWORD) {
    args.push("-pass", SIGNING_CERT_PASSWORD);
  }

  if (TIMESTAMP_URL) {
    args.push("-t", TIMESTAMP_URL);
  }

  try {
    await run(toolPath, args);
    await fs.copyFile(outputPath, executablePath);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

export async function maybeSignExecutable(
  executablePath: string,
): Promise<void> {
  const signer = resolveSigner();

  if (!signer) {
    return;
  }

  try {
    await fs.access(SIGNING_CERT_PATH!);
  } catch {
    throw new Error(
      `Signing certificate not found at ${SIGNING_CERT_PATH}. Ensure WINDOWS_AGENT_SIGNING_CERT_PATH is correct.`,
    );
  }

  try {
    if (signer === "signtool") {
      await signWithSignTool(executablePath);
      return;
    }

    await signWithOsslsigncode(executablePath);
  } catch (error) {
    throw new Error("Failed to sign Windows agent executable.", { cause: error as Error });
  }
}
