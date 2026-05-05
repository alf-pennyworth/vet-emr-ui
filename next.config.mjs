/** @type {import('next').NextConfig} */

import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
