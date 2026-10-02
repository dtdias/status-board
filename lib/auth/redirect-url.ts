export function getRedirectOrigin(requestHeaders: Headers) {
  const configuredUrl = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (configuredUrl) return configuredUrl;

  const origin = requestHeaders.get("origin");
  if (origin) return origin;

  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return host ? `${protocol}://${host}` : "http://localhost:3000";
}
