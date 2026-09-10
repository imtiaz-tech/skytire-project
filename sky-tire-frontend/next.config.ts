import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5001",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        pathname: "/uploads/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/fpjs/v:version/:apiKey/loader_v:loaderVersion.js",
        destination:
          "https://fpjscdn.net/v:version/:apiKey/loader_v:loaderVersion.js",
      },
      {
        source: "/fpjs/api/:path*",
        destination: "https://api.fpjs.io/:path*",
      },
    ];
  },
};

export default nextConfig;
