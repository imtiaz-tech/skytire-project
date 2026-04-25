import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/fpjs/v:version/:apiKey/loader_v:loaderVersion.js',
        destination: 'https://fpjscdn.net/v:version/:apiKey/loader_v:loaderVersion.js',
      },
      {
        source: '/fpjs/api/:path*',
        destination: 'https://api.fpjs.io/:path*',
      },
    ];
  },
};

export default nextConfig;
