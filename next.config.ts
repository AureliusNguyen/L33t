import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // The emscripten-generated wasm glue uses `new URL(".", import.meta.url)`
    // for runtime script-directory discovery. Turbopack's static analysis
    // flags it as an unresolvable module specifier even though it works at
    // runtime. Suppress the noise for that specific file.
    ignoreIssue: [{ path: "**/lib/wasm/l33t-core.js" }],
  },
};

export default nextConfig;
