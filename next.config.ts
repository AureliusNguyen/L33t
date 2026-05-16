import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Empty config silences the "webpack vs turbopack" warning and signals
    // we are intentionally on Turbopack. The emscripten-produced wasm loader
    // uses fetch + import.meta.url, which Turbopack handles natively.
  },
};

export default nextConfig;
