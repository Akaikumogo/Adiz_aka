export function normalizeIp(ip: string): string {
  return ip.trim().replace(/\s+/g, '')
}
