export const WINDOWS_AGENT_ERROR_CODES = {
  SIGNING_CONFIGURATION_ERROR: "SIGNING_CONFIGURATION_ERROR",
  SIGNING_EXECUTION_ERROR: "SIGNING_EXECUTION_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type WindowsAgentErrorCode =
  (typeof WINDOWS_AGENT_ERROR_CODES)[keyof typeof WINDOWS_AGENT_ERROR_CODES];

export function isWindowsAgentErrorCode(value: unknown): value is WindowsAgentErrorCode {
  return (
    typeof value === "string" &&
    Object.values(WINDOWS_AGENT_ERROR_CODES).includes(
      value as WindowsAgentErrorCode,
    )
  );
}
