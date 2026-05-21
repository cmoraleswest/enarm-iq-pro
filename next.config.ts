import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/generar": ["./data/**/*"],
    "/api/exam":    ["./data/**/*"],
  },
  serverExternalPackages: ['firebase-admin', '@google-cloud/storage', 'google-auth-library'],
};

export default nextConfig;
