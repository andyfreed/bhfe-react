import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // Temporarily disabled CSP headers to fix white screen issue
  // TODO: Re-enable with proper configuration for Next.js inline scripts
  eslint: {
    // Warning: This allows production builds to complete even if ESLint errors exist
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
