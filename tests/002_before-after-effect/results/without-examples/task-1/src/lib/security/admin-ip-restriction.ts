// Admin IP restriction with CIDR support and IPv6 normalization

function ipToNumber(ip: string): number {
  const parts = ip.split(".");
  return (
    ((parseInt(parts[0]) << 24) |
      (parseInt(parts[1]) << 16) |
      (parseInt(parts[2]) << 8) |
      parseInt(parts[3])) >>>
    0
  );
}

function isIpv4InCidr(ip: string, cidr: string): boolean {
  const [network, prefixStr] = cidr.split("/");
  const prefix = parseInt(prefixStr);
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;

  try {
    const ipNum = ipToNumber(ip);
    const networkNum = ipToNumber(network);
    return (ipNum & mask) === (networkNum & mask);
  } catch {
    return false;
  }
}

function normalizeIpv6(ip: string): string {
  // Remove IPv4-mapped IPv6 prefix
  if (ip.startsWith("::ffff:")) {
    return ip.slice(7);
  }
  if (ip.startsWith("::ffff:")) {
    return ip.slice(7);
  }
  return ip.toLowerCase();
}

function isIpv4(ip: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
}

function isIpv6Cidr(cidr: string): boolean {
  return cidr.includes(":") && cidr.includes("/");
}

function expandIpv6(ip: string): bigint {
  // Expand :: notation
  const parts = ip.split("::");
  let left = parts[0] ? parts[0].split(":") : [];
  let right = parts[1] ? parts[1].split(":") : [];

  while (left.length + right.length < 8) {
    left.push("0");
  }

  const all = [...left, ...right].map((p) => parseInt(p || "0", 16));
  return all.reduce((acc, val) => (acc << BigInt(16)) | BigInt(val), BigInt(0));
}

function isIpv6InCidr(ip: string, cidr: string): boolean {
  const [network, prefixStr] = cidr.split("/");
  const prefix = parseInt(prefixStr);

  try {
    const ipNum = expandIpv6(ip);
    const networkNum = expandIpv6(network);
    const mask =
      prefix === 0
        ? BigInt(0)
        : (~BigInt(0) << BigInt(128 - prefix)) & ((BigInt(1) << BigInt(128)) - BigInt(1));

    return (ipNum & mask) === (networkNum & mask);
  } catch {
    return false;
  }
}

function isIpAllowed(clientIp: string, allowedEntry: string): boolean {
  const normalizedClient = normalizeIpv6(clientIp.trim());
  const normalizedEntry = allowedEntry.trim();

  // CIDR notation
  if (normalizedEntry.includes("/")) {
    if (isIpv4(normalizedClient) && !isIpv6Cidr(normalizedEntry)) {
      return isIpv4InCidr(normalizedClient, normalizedEntry);
    } else if (!isIpv4(normalizedClient)) {
      return isIpv6InCidr(normalizedClient, normalizedEntry);
    }
    return false;
  }

  // Exact match
  return normalizedClient === normalizeIpv6(normalizedEntry);
}

export function isAdminIpAllowed(clientIp: string | null): boolean {
  if (!clientIp) return false;

  const allowedIpsEnv = process.env.ADMIN_ALLOWED_IPS;

  // If not configured, deny all in production, allow all in development
  if (!allowedIpsEnv) {
    return process.env.NODE_ENV === "development";
  }

  const allowedIps = allowedIpsEnv.split(",").map((ip) => ip.trim()).filter(Boolean);

  if (allowedIps.length === 0) {
    return process.env.NODE_ENV === "development";
  }

  return allowedIps.some((entry) => isIpAllowed(clientIp, entry));
}

export function getAdminAllowedIps(): string[] {
  const env = process.env.ADMIN_ALLOWED_IPS;
  if (!env) return [];
  return env.split(",").map((ip) => ip.trim()).filter(Boolean);
}
