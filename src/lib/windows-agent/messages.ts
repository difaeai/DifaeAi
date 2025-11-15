import {
  WINDOWS_AGENT_ERROR_CODES,
  type WindowsAgentErrorCode,
} from "./errors";

const GENERIC_FAILURE_MESSAGE =
  "Failed to generate the Windows agent. Please try again.";

const WINDOWS_AGENT_ERROR_MESSAGES: Record<WindowsAgentErrorCode, string> = {
  [WINDOWS_AGENT_ERROR_CODES.VALIDATION_FAILED]:
    "The provided camera details are invalid. Check the form and try again.",
  [WINDOWS_AGENT_ERROR_CODES.TEMPLATE_MISSING]:
    "The Windows agent template executable is missing from the server.",
  [WINDOWS_AGENT_ERROR_CODES.SIGNING_CONFIGURATION_ERROR]:
    "The Windows agent signing configuration is invalid. Contact support.",
  [WINDOWS_AGENT_ERROR_CODES.SIGNING_EXECUTION_ERROR]:
    "We couldn't sign the Windows agent executable. Try again later or contact support.",
  [WINDOWS_AGENT_ERROR_CODES.STORAGE_CONFIGURATION_ERROR]:
    "Windows agent storage is not configured correctly. Contact support.",
  [WINDOWS_AGENT_ERROR_CODES.STORAGE_UPLOAD_FAILED]:
    "Uploading the Windows agent to storage failed. Please try again.",
  [WINDOWS_AGENT_ERROR_CODES.STORAGE_URL_GENERATION_FAILED]:
    "We couldn't create a download link for the Windows agent. Try again later.",
  [WINDOWS_AGENT_ERROR_CODES.FIREBASE_INIT_FAILED]:
    "Backend services are unavailable right now. Try again later.",
  [WINDOWS_AGENT_ERROR_CODES.FIRESTORE_WRITE_FAILED]:
    "We couldn't update the agent status. Try again later.",
  [WINDOWS_AGENT_ERROR_CODES.DOWNLOAD_REGISTRATION_FAILED]:
    "We couldn't prepare the agent download. Try again later.",
  [WINDOWS_AGENT_ERROR_CODES.UNKNOWN_ERROR]: GENERIC_FAILURE_MESSAGE,
};

export function getWindowsAgentErrorMessage(
  code: WindowsAgentErrorCode,
  fallback?: string,
) {
  if (code === WINDOWS_AGENT_ERROR_CODES.VALIDATION_FAILED && fallback) {
    return fallback;
  }

  return WINDOWS_AGENT_ERROR_MESSAGES[code] ?? fallback ?? GENERIC_FAILURE_MESSAGE;
}
