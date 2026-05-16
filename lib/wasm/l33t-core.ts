// TypeScript wrapper around the emscripten-produced l33t-core module.
//
// The wasm is inlined into l33t-core.js as base64 (SINGLE_FILE=1), so a
// single dynamic import gives us the whole module with no separate .wasm
// fetch. Turbopack code-splits the import into its own chunk, lazy-loaded
// when the slider component mounts.

type EmscriptenModule = {
  HEAPU8: Uint8Array;
  _malloc: (n: number) => number;
  _free: (ptr: number) => void;
  cwrap: <T extends unknown[], R>(
    name: string,
    ret: string | null,
    args: string[]
  ) => (...args: T) => R;
};

type EmscriptenFactory = (cfg?: Record<string, unknown>) => Promise<EmscriptenModule>;

let modulePromise: Promise<EmscriptenModule> | null = null;

async function loadModule(): Promise<EmscriptenModule> {
  if (modulePromise) return modulePromise;
  modulePromise = (async () => {
    const factory = (await import("./l33t-core.js")) as unknown as {
      default: EmscriptenFactory;
    };
    return factory.default();
  })();
  return modulePromise;
}

export type CoreHandle = {
  init: (buckets: number) => void;
  reset: () => void;
  benchOneOp: (bytes: Uint8Array) => number;
};

export async function loadCore(buckets = 65536): Promise<CoreHandle> {
  const mod = await loadModule();
  const initFn = mod.cwrap<[number], void>("kv_init", null, ["number"]);
  const resetFn = mod.cwrap<[], void>("kv_reset", null, []);
  const benchFn = mod.cwrap<[number, number], number>(
    "bench_one_op",
    "number",
    ["number", "number"]
  );

  initFn(buckets);

  return {
    init: (b: number) => initFn(b),
    reset: () => resetFn(),
    benchOneOp: (bytes: Uint8Array): number => {
      const ptr = mod._malloc(bytes.length);
      mod.HEAPU8.set(bytes, ptr);
      const ns = benchFn(ptr, bytes.length);
      mod._free(ptr);
      return ns;
    },
  };
}

/** Encode a SET request in the l33t wire format. */
export function encodeSet(key: string, value: string): Uint8Array {
  const k = new TextEncoder().encode(key);
  const v = new TextEncoder().encode(value);
  const buf = new Uint8Array(3 + k.length + 2 + v.length);
  buf[0] = 0x01;
  buf[1] = (k.length >> 8) & 0xff;
  buf[2] = k.length & 0xff;
  buf.set(k, 3);
  buf[3 + k.length] = (v.length >> 8) & 0xff;
  buf[3 + k.length + 1] = v.length & 0xff;
  buf.set(v, 3 + k.length + 2);
  return buf;
}

/** Encode a GET request. */
export function encodeGet(key: string): Uint8Array {
  const k = new TextEncoder().encode(key);
  const buf = new Uint8Array(3 + k.length);
  buf[0] = 0x02;
  buf[1] = (k.length >> 8) & 0xff;
  buf[2] = k.length & 0xff;
  buf.set(k, 3);
  return buf;
}
