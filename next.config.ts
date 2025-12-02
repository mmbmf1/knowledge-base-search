import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent webpack from bundling these packages for server-side inference
  serverExternalPackages: ['sharp', 'onnxruntime-node'],
};

export default nextConfig;
