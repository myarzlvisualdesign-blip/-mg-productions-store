import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-d1fc5a51-8d86-401d-9ea3-c7f1387612a1.space.z.ai",
    "*.space.z.ai",
  ],
};

export default nextConfig;
