/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@whatsapp-saas/ui", "@whatsapp-saas/utils"],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
