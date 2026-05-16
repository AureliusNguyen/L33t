# l33t showcase site - design spec

Date: 2026-05-16
Status: approved (pending final spec review)
Author: AureliusNguyen (shado)

## Purpose

Build a single longform web page that showcases the l33t KV store project
(custom binary protocol, C/epoll server, parity with Redis 6.0 on lab LAN)
to readers who land on it from a personal site link. Primary reader: YC /
founder-screening reader. Secondary reader: technical recruiter or hiring
engineer. The page must not look vibecoded - no Lucide icons, no gradient
chrome, no SaaS-marketing template patterns. It must read as a written
artifact, not a landing page.

## What this project replaces / relates to

- Source benchmarks and analysis already exist in the csci-5980 repo:
  `l33t-server-epoll.c`, `l33t-benchmark.c`, `Redis_Solo.md`, `README.md`.
- This site lifts the recorded benchmark numbers and structural narrative
  but is its own deploy in `../L33t/`. The csci-5980 repo is the source
  of truth for benchmarks; the L33t repo is the source of truth for the
  showcase site.

## Non-goals

- No live l33t-server hosted on a backend (the LAN ceiling cannot be
  reproduced on a single cloud VM).
- No persistence, replication, eviction, or auth claims - the site
  honestly documents that these are absent from l33t-server-epoll and
  are what Redis's 15+ years of engineering buys.
- No analytics, GDPR banner, consent popup, social share buttons,
  comment section, "powered by" badges.
- No dark/light toggle. The page is dark. The aesthetic is intentional.
- No i18n.
- No automated test suite. Verification is a manual browser walkthrough
  plus Lighthouse run.

## Architecture

### Stack

- Next.js 16 (App Router, Cache Components on by default)
- Tailwind CSS v4 (CSS-first config, no `tailwind.config.js`)
- Motion (formerly Framer Motion) for scroll-sync orchestration,
  counter ticks, and crossfades
- next/font/google loading Fraunces + Newsreader + IBM Plex Mono
- Emscripten compiling a refactored `l33t-core.c` to `l33t-core.wasm`
- No icon library. SVG hand-drawn where needed.
- No chart library. Hand-built SVG (data is small: ~4 rows, ~4 ceilings).
- Deploy: Vercel, zero backend, single static + WASM asset deployment.

### File layout

```
L33t/
  app/
    layout.tsx              # font loading, root html, global type
    page.tsx                # the whole longform page
    globals.css             # palette tokens, type scale, motion overrides
  components/
    Hero.tsx                # full-bleed opener with background terminal
    DualColumn.tsx          # scroll-sync container (left prose, right sticky stage)
    LeftProse.tsx           # 9 prose sections, IntersectionObserver-instrumented
    RightStage.tsx          # sticky panel, crossfades between artifacts
    ReadingProgress.tsx     # thin cyan line on the left page margin
    ClosingLine.tsx
    artifacts/
      ReplayTerminal.tsx    # scripted typewriter terminal (one per ceiling)
      ValueSweepChart.tsx   # SVG bar chart for Redis value-size sweep
      WasmRttSlider.tsx     # the signature interactive widget
      IoUringNullResult.tsx # the "dog that didn't bark" terminal
  lib/
    wasm/
      l33t-core.ts          # TS wrapper around the wasm module
      l33t-core.wasm        # compiled binary (committed)
      l33t-core.js          # emscripten glue (committed)
  public/
    grain.svg               # feTurbulence noise overlay
  wasm-src/
    l33t-core.c             # refactored hashtable + parser from l33t-server-epoll.c
    Makefile                # emcc invocation
  next.config.ts
  docs/superpowers/specs/
    2026-05-16-l33t-showcase-design.md   # this file
```

### Build pipeline

- Vercel runs `next build`. No WASM compilation in the Vercel build step;
  the `.wasm` and glue `.js` are committed artifacts.
- WASM is rebuilt locally via `make -C wasm-src` when `l33t-core.c`
  changes, then the artifacts are committed. This keeps Vercel's build
  simple and removes emscripten from the deploy critical path.

## Page structure and narrative

### Narrative arc: the ladder

Four ceilings, three rewrites, and the discovery that the network was
always the wall. Each ceiling is one section. The arc is:

1. Hero (full-bleed)
2. Setup
3. Ceiling 1: Python asyncio
4. Ceiling 2: uvloop + tightened Python
5. Ceiling 3: C epoll  (signature WASM widget lives here)
6. Redis comparison
7. Ceiling 4: io_uring (the dog that didn't bark)
8. What this isn't (honest caveats)
9. Close

### Right-column artifact mapping (dual-column sections)

```
hero                  -> full-bleed, no right column
setup                 -> ReplayTerminal: basic SET/GET protocol bytes
ceiling-1-python      -> ReplayTerminal: python-asyncio benchmark output
ceiling-2-uvloop      -> ReplayTerminal: uvloop benchmark output
ceiling-3-epoll       -> WasmRttSlider (the signature widget)
redis-comparison      -> ValueSweepChart (SVG bars, animated draw on enter)
ceiling-4-iouring     -> IoUringNullResult terminal
what-this-isnt        -> full-bleed, no right column
close                 -> full-bleed
```

### Prose content sourcing

Lift structure and recorded numbers from `Redis_Solo.md` and `README.md`
in the csci-5980 repo. Rewrite prose in a longform-essay register (not a
docs register). Each ceiling section: 2-3 paragraphs + a result number.
The middle section is the data, the writing is the connective tissue.

## Visual system

### Typography

| Role | Font | Notes |
|------|------|-------|
| Display headlines, ceiling numbers | Fraunces (variable, SOFT + WONK axes) | distinctive at large sizes |
| Body prose | Newsreader (variable, optical-size axis) | beautiful italic, literary |
| Mono (data, terminal, code) | IBM Plex Mono | characterful slab-italic |

All three free, all available via `next/font/google`. No Inter, no Geist,
no JetBrains Mono, no Space Grotesk.

### Type scale (modular, 1.25 ratio)

```
display-1   72px  Fraunces 400 wght, SOFT 50, WONK 1  (hero only)
display-2   56px  Fraunces 400 wght                   (section opens)
numeric     240px Fraunces 300 wght                   (oversized 01-04)
h1          40px  Fraunces 500
h2          28px  Fraunces 500
lede        22px  Newsreader 400, italic              (dek under heading)
body        18px  Newsreader 400, 1.6 line-height
small       14px  Newsreader 400
mono-body   16px  IBM Plex Mono 400
mono-data   14px  IBM Plex Mono 500, tabular nums
```

### Color tokens

```css
--ink:        #ebe2cf;   /* warm cream, primary text */
--ink-dim:    #c2b9a4;   /* secondary text */
--ink-muted:  #6a7a93;   /* footnotes, slate-blue */
--midnight:   #0c1322;   /* page background */
--midnight-2: #0f1828;   /* card / artifact background */
--rule:       #1a2538;   /* hairline rules between sections */
--cyan:       #5fd9f5;   /* the one accent */
--cyan-dim:   #2b6479;   /* desaturated cyan for inactive states */
```

Cyan rationing: terminal cursor, active reading-section marker, WASM
slider thumb, and exactly ONE headline number per ceiling section
(e.g., the `36,234` in Ceiling 3). Nowhere else.

### Texture

- Film grain at 3% opacity over the whole page via single inline SVG
  with `<feTurbulence>`, `pointer-events: none`. This is the one effect
  that quietly separates editorial-dark from vibecoded-dark.
- Scanlines (1px horizontal at 6% opacity, 2px gap) ONLY inside
  terminal artifact components, not the whole page.
- No glow, no shadow, no glassmorphism, no Tailwind `bg-gradient-*`
  utilities. Page is flat surfaces with hairline rules.

### Spatial composition

- Page max width: 1280px, centered
- Left/right gutter: 64px desktop, 24px mobile
- Dual-column grid: 58% prose / 42% artifacts, 96px gap (asymmetric on
  purpose - symmetric 50/50 reads as docs-site)
- Oversized ceiling numbers ("01", "02", "03", "04") set in Fraunces at
  240px, absolutely positioned with `left: -32px` to clip the column
  edge intentionally, rendered behind prose at `--ink-muted` opacity 12%
- Hairline 1px rules at `--rule` between major sections

### Motion budget

1. Hero load choreography (the one big moment): title SVG stroke-in,
   dek fades up 8px with 200ms stagger, background terminal starts its
   typewriter. Total ~1.8s, then page is calm. Reduced-motion: instant.
2. Reading progress: 1px vertical cyan line on left margin, fills as
   user scrolls. Live, no easing.
3. Counter ticks: one headline number per ceiling section counts up
   from 0 on viewport entry. Cubic-out, 800ms.
4. Right-column crossfades: 180ms opacity + 8px y-shift via Motion's
   AnimatePresence on active-section change.
5. WASM slider: live re-render of throughput on drag. No animation.
6. Terminal cursor blink: 1s on/off, CSS-only.

Nothing else moves. No hover bounce, no parallax, no mouse trails, no
custom cursor.

## The dual-column scroll-sync mechanic

- CSS Grid: `grid-template-columns: 58% 42%; gap: 96px;`
- Right column: `position: sticky; top: 96px;`. Contains a fixed-height
  (~520px) stage that displays one artifact at a time.
- Single IntersectionObserver watches each prose section in the left
  column with `rootMargin: "-30% 0px -50% 0px"`. The active section is
  whatever is currently in the upper-middle of the viewport.
- When active section changes, right column crossfades to the
  corresponding artifact via Motion `<AnimatePresence>` (180ms opacity
  + 8px y-shift).
- Mobile breakpoint at 900px: no sticky right column. Each artifact
  appears inline immediately after its prose section. Crossfade becomes
  a single fade-in on viewport entry.
- Reduced motion: instant swaps, instant counter values.

## The WASM RTT slider

### What gets compiled

A new `wasm-src/l33t-core.c` extracted from `l33t-server-epoll.c`,
containing only:
- FNV-1a hash function
- Open-addressed hash table (insert / lookup / tombstone), bucket count
  parameterised (smaller for browser memory budget; ~64K buckets)
- Protocol byte parser: input is flat byte buffer, output is
  `{op, key, value}` struct
- Entry point `bench_one_op(uint8_t *buf, size_t len)` that times one
  parse + lookup-or-insert and returns nanoseconds

### Build command (`wasm-src/Makefile`)

```
emcc -O3 l33t-core.c \
  -s EXPORTED_FUNCTIONS='["_bench_one_op","_kv_init","_kv_reset","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","HEAPU8"]' \
  -s MODULARIZE=1 -s EXPORT_ES6=1 \
  -s ENVIRONMENT=web -s ALLOW_MEMORY_GROWTH=1 \
  -o ../lib/wasm/l33t-core.js
```

Emits `l33t-core.js` (glue) + `l33t-core.wasm` (binary). Both committed.

### Widget UX

```
RTT       0 ms ----o---- 200 ms
                  ^ 80

estimated throughput
       36,127 ops/sec
       ^ counts down as you drag right

cpu work        5.2 microsec  (measured live in WASM)
bandwidth       2.1 microsec  (computed from value size)
network RTT    80.0 microsec  (you control this)
bottleneck: network
```

### Math

```
throughput = clients / (cpu_us + bandwidth_us + rtt_us)
```

- `cpu_us`: median of 1000 live WASM benchmark runs at component mount
- `bandwidth_us`: derived from value size and assumed 1 Gbit link
- `rtt_us`: slider value
- `clients`: hardcoded to 3 (matches the real benchmark)

### Honesty

- CPU number is REAL (actual WASM execution, not faked)
- RTT is what the user dialled in
- Combined throughput is back-of-envelope but the label says "estimated"
  and all inputs are visible
- This proves the thesis (RTT dominates) through interaction, not rhetoric

### Slider behavior

- Native `<input type="range">` styled with CSS
- onChange fires the recompute
- Throttled to 60Hz
- Headline number flashes cyan briefly on change

## Verification

- `npm run dev` and walk through the page in Chrome before claiming
  anything works
- Test cases:
  - Hero typewriter fires on first load
  - Each of the 4 right-column crossfades triggers at the right
    scroll position
  - WASM module loads, the slider live-recomputes the throughput
  - Value-size chart bars animate on viewport entry
  - Mobile layout collapses cleanly at 900px (sticky right column
    disappears, artifacts appear inline)
- Reduced-motion test via Chrome DevTools Rendering pane: everything
  readable and functional with all motion disabled
- Lighthouse on local production build: target performance >= 90,
  accessibility >= 95

## Deploy

- `git init` + first commit in `../L33t/`
- Create GitHub repo, push
- Connect to Vercel via dashboard or `vercel` CLI
- Deploy lands on a `vercel.app` subdomain
- Domain swap deferred until later; the site is meant to be linked from
  user's personal site, not stood up as a standalone brand

## Open follow-ups (intentionally deferred)

- Value-size sweep widget could become interactive (let user select
  size, watch the bars redraw) - deferred until after baseline ship
- Code walkthrough section showing the actual l33t-server-epoll.c source
  inline with annotation - deferred; this design ships without it
- Real benchmark replay using actual timestamped log files instead of
  hardcoded typewriter strings - deferred; first ship uses curated
  scripts

