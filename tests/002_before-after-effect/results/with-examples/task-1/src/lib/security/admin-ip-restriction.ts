// Admin IP restriction utility.
// Configure allowed IPs via ADMIN_ALLOWED_IPS environment variable.
// Multiple IPs/CIDRs can be specified with comma separation.
// Example: ADMIN_ALLOWED_IPS="203.0.113.1,192.168.1.0/24"

function normalizeIpv6(ip: string): string {
  // Convert IPv6 loopback to IPv4 equivalent
  if (ip === "::1") return "127.0.0.1";
  return ip;
}

function ipToUint32(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split("/");
  if (!bits) return ip === range;

  const mask = ~(2 ** (32 - Number(bits)) - 1) >>> 0;
  try {
    return (ipToUint32(ip) & mask) === (ipToUint32(range) & mask);
  } catch {
    return false;
  }
}

function isIpv4(ip: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(ip);
}

export function isAdminIpAllowed(clientIp: string | null): boolean {
  const allowedIps = process.env.ADMIN_ALLOWED_IPS;

  // If not configured, allow all IPs
  if (!allowedIps) return true;

  // Block if IP cannot be determined
  if (!clientIp) return false;

  const normalizedIp = normalizeIpv6(clientIp.trim());

  if (!isIpv4(normalizedIp)) {
    // For IPv6 addresses that are not loopback, do exact match only
    const entries = allowedIps.split(",").map((s) => s.trim());
    return entries.includes(normalizedIp);
  }

  const entries = allowedIps.split(",").map((s) => s.trim());
  return entries.some((entry) => {
    if (entry.includes("/")) {
      return isIpInCidr(normalizedIp, entry);
    }
    return normalizedIp === entry;
  });
}
