import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cloudinary does resizing/format negotiation at the edge, so we skip the
    // Next.js optimizer and build transformation URLs instead.
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
  },
  serverExternalPackages: ["cloudinary"],
};

export default nextConfig;
