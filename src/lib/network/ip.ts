const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

const PRIVATE_IPV4_RANGES = [
  /^(10)\./,
  /^(172)\.(1[6-9]|2\d|3[0-1])\./,
  /^(192\.168)\./,
  /^(127)\./,
  /^(169\.254)\./,
];

export function isValidIPv4(ip: string | null | undefined): ip is string {
  if (!ip) return false;
  return IPV4_REGEX.test(ip.trim());
}

export function isPrivateIPv4(ip: string): boolean {
  return PRIVATE_IPV4_RANGES.some((regex) => regex.test(ip));
}

export function isPublicIPv4(ip: string | null | undefined): ip is string {
  if (!isValidIPv4(ip)) return false;
  return !isPrivateIPv4(ip);
}
