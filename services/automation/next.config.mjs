/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The webhook needs to read the raw body for signature verification; the
  // App Router does this correctly via `req.text()` so no special config.
};

export default nextConfig;
