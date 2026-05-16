# l33t

Showcase site for the l33t key-value store - a custom binary-protocol KV
server in C that ties Redis 6.0 on a lab LAN.

Project source (server, benchmarks, analysis) lives in a separate repo.
This repo is just the long-form web page that presents the work.

## Stack

- Next.js 16 (App Router, Turbopack, static export)
- Tailwind CSS v4 (CSS-first `@theme`)
- Motion (formerly Framer Motion) for scroll-sync orchestration
- Fonts: Fraunces (display), Newsreader (body), IBM Plex Mono (data)
- Emscripten for the WASM core (FNV-1a hash + protocol parser, inlined
  into the JS glue via `SINGLE_FILE=1`)

## Layout

```
app/                  - layout + the single longform page
components/           - Hero, ReadingProgress, DualColumn, LeftProse
components/artifacts/ - ReplayTerminal, ValueSweepChart, WasmRttSlider,
                        IoUringNullResult
lib/wasm/             - typed wrapper around the emscripten module
wasm-src/             - C source + Makefile (rebuild with emsdk activated)
docs/superpowers/     - design spec + implementation plan
```

## Local dev

```
nvm use 20
npm install
npm run dev
```

http://localhost:3000

## Rebuilding the WASM core

Only needed if `wasm-src/l33t-core.c` changes. Vercel does not run
emscripten - the built `lib/wasm/l33t-core.js` is committed.

```
source $HOME/emsdk/emsdk_env.sh
make -C wasm-src OUT_DIR=../lib/wasm
git add lib/wasm/l33t-core.js
```

## Deploy

Push to `main`. Vercel rebuilds and promotes to production automatically
via the GitHub integration.
