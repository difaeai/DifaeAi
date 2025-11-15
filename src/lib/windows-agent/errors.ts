export const WINDOWS_AGENT_ERROR_CODES = {
  VALIDATION_FAILED: "validation_failed",
  TEMPLATE_MISSING: "template_missing",
  SIGNING_CONFIGURATION_ERROR: "signing_configuration_error",
  SIGNING_EXECUTION_ERROR: "signing_execution_error",
  STORAGE_CONFIGURATION_ERROR: "storage_configuration_error",
  STORAGE_UPLOAD_FAILED: "storage_upload_failed",
  STORAGE_URL_GENERATION_FAILED: "storage_url_generation_failed",
  FIREBASE_INIT_FAILED: "firebase_init_failed",
  FIRESTORE_WRITE_FAILED: "firestore_write_failed",
  DOWNLOAD_REGISTRATION_FAILED: "download_registration_failed",
  UNKNOWN_ERROR: "unknown_error",
} as const;

export type WindowsAgentErrorCode =
  (typeof WINDOWS_AGENT_ERROR_CODES)[keyof typeof WINDOWS_AGENT_ERROR_CODES];

const ERROR_CODES = new Set<WindowsAgentErrorCode>(
  Object.values(WINDOWS_AGENT_ERROR_CODES) as WindowsAgentErrorCode[],
);

export function isWindowsAgentErrorCode(value: unknown): value is WindowsAgentErrorCode {
  return typeof value === "string" && ERROR_CODES.has(value as WindowsAgentErrorCode);
}
