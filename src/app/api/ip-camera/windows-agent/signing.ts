import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const DEFAULT_SIGNING_TOOL = "osslsigncode";
const DEFAULT_TIMESTAMP_URL = "http://timestamp.digicert.com";
const DEFAULT_DESCRIPTION = "Difae Camera Bridge Agent";
const DEFAULT_URL = "https://difae.ai";

interface ExtendedErrorOptions {
  cause?: unknown;
}

type ErrorConstructor<T extends Error> = new (
  message: string,
  options?: ExtendedErrorOptions,
) => T;

function parseArgs(value: string | undefined) {
  if (!value) {
    return [] as string[];
  }

  return (
    value.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((part) => part.replace(/^"|"$/g, "")) ?? []
  );
}

export class SigningConfigurationError extends Error {
  constructor(message: string, options?: ExtendedErrorOptions) {
    super(message, options);
    this.name = "SigningConfigurationError";
  }
}

export class SigningExecutionError extends Error {
  constructor(message: string, options?: ExtendedErrorOptions) {
    super(message, options);
    this.name = "SigningExecutionError";
  }
}

async function ensureReadableFile<T extends Error>(
  filePath: string,
  errorMessage: string,
  ErrorCtor: ErrorConstructor<T>,
) {
  try {
    await access(filePath, fsConstants.R_OK);
  } catch (error) {
    throw new ErrorCtor(errorMessage, {
      cause: error instanceof Error ? error : undefined,
    });
  }
}

export async function maybeSignExecutable(executablePath: string) {
  const certificatePath = process.env.WINDOWS_AGENT_SIGNING_CERT_PATH;
  if (!certificatePath) {
    return;
  }

  const signingTool = process.env.WINDOWS_AGENT_SIGNING_TOOL || DEFAULT_SIGNING_TOOL;
  const timestampUrl =
    process.env.WINDOWS_AGENT_SIGNING_TIMESTAMP_URL || DEFAULT_TIMESTAMP_URL;
  const description =
    process.env.WINDOWS_AGENT_SIGNING_DESCRIPTION || DEFAULT_DESCRIPTION;
  const informationUrl = process.env.WINDOWS_AGENT_SIGNING_URL || DEFAULT_URL;
  const additionalArgs = parseArgs(process.env.WINDOWS_AGENT_SIGNING_ARGS);
  const verifyArgs = parseArgs(process.env.WINDOWS_AGENT_SIGNING_VERIFY_ARGS);
  const shouldVerify = process.env.WINDOWS_AGENT_SIGNING_SKIP_VERIFY !== "1";

  const certificatePassword = process.env.WINDOWS_AGENT_SIGNING_CERT_PASSWORD;
  if (certificatePassword === undefined) {
    throw new SigningConfigurationError(
      "WINDOWS_AGENT_SIGNING_CERT_PASSWORD must be set when signing is enabled.",
    );
  }

  await ensureReadableFile(
    certificatePath,
    `Windows agent signing certificate not found at ${certificatePath}.`,
    SigningConfigurationError,
  );
  await ensureReadableFile(
    executablePath,
    `Windows agent executable not found at ${executablePath}.`,
    SigningExecutionError,
  );

  const signArgs = [
    "sign",
    ...additionalArgs,
    "-pkcs12",
    certificatePath,
    "-pass",
    certificatePassword,
    "-n",
    description,
    "-i",
    informationUrl,
    "-t",
    timestampUrl,
    "-in",
    executablePath,
    "-out",
    executablePath,
  ];

  try {
    await execFileAsync(signingTool, signArgs, {
      maxBuffer: 1024 * 1024 * 10,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unknown signing error";
    throw new SigningExecutionError(
      `Failed to sign Windows agent executable with ${signingTool}: ${message}`,
      { cause: error instanceof Error ? error : undefined },
    );
  }

  if (!shouldVerify) {
    return;
  }

  try {
    await execFileAsync(signingTool, ["verify", ...verifyArgs, "-in", executablePath], {
      maxBuffer: 1024 * 1024 * 10,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unknown verification error";
    throw new SigningExecutionError(
      `Signed Windows agent executable failed verification: ${message}`,
      { cause: error instanceof Error ? error : undefined },
    );
  }
}
