import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow async wasm imports (used by the emscripten-generated l33t-core).
  webpack: (config) => {
    config.experiments = { ...(config.experiments ?? {}), asyncWebAssembly: true };
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });
    return config;
  },
};

export default nextConfig;
