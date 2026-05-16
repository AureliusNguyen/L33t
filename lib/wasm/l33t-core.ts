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

export type ExecResult = {
  ok: boolean;
  /** "ok" for SET success, "value" for GET hit, "not_found" for GET miss, "error" otherwise. */
  response: "ok" | "value" | "not_found" | "error";
};

export type CoreHandle = {
  init: (buckets: number) => void;
  reset: () => void;
  /** Single-op timing (returns ns). Coarse on browsers without COOP/COEP. */
  benchOneOp: (bytes: Uint8Array) => number;
  /** Batched timing (returns total ns for `iters` ops). Divide for per-op. */
  benchBatch: (bytes: Uint8Array, iters: number) => number;
  /** Execute one op and return its response kind. */
  execOneOp: (bytes: Uint8Array) => ExecResult;
};

// Singleton CoreHandle: both InteractiveSetup and WasmRttSlider call loadCore.
// Without this guard, each call would invoke kv_init() and wipe whatever
// hashtable state the other has accumulated. Sharing one handle keeps the
// user's SET/GET history alive across artifact components.
let corePromise: Promise<CoreHandle> | null = null;

export async function loadCore(buckets = 65536): Promise<CoreHandle> {
  if (corePromise) return corePromise;
  corePromise = (async () => {
    const mod = await loadModule();
    const initFn = mod.cwrap<[number], void>("kv_init", null, ["number"]);
    const resetFn = mod.cwrap<[], void>("kv_reset", null, []);
    const benchOneFn = mod.cwrap<[number, number], number>(
      "bench_one_op",
      "number",
      ["number", "number"]
    );
    const benchBatchFn = mod.cwrap<[number, number, number], number>(
      "bench_batch",
      "number",
      ["number", "number", "number"]
    );
    const execFn = mod.cwrap<[number, number], number>(
      "exec_one_op",
      "number",
      ["number", "number"]
    );

    initFn(buckets);

    function withBuffer<R>(bytes: Uint8Array, fn: (ptr: number) => R): R {
      const ptr = mod._malloc(bytes.length);
      mod.HEAPU8.set(bytes, ptr);
      try {
        return fn(ptr);
      } finally {
        mod._free(ptr);
      }
    }

    return {
      init: (b: number) => initFn(b),
      reset: () => resetFn(),
      benchOneOp: (bytes) => withBuffer(bytes, (ptr) => benchOneFn(ptr, bytes.length)),
      benchBatch: (bytes, iters) =>
        withBuffer(bytes, (ptr) => benchBatchFn(ptr, bytes.length, iters)),
      execOneOp: (bytes) =>
        withBuffer(bytes, (ptr) => {
          const code = execFn(ptr, bytes.length);
          const ok = (code & 0x1) === 0x1;
          if (!ok) return { ok: false, response: "error" };
          const respBits = (code >> 1) & 0x3;
          if (respBits === 0) return { ok: true, response: "ok" };
          if (respBits === 1) return { ok: true, response: "value" };
          if (respBits === 2) return { ok: true, response: "not_found" };
          return { ok: false, response: "error" };
        }),
    };
  })();
  return corePromise;
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

/**
 * Parse a user-typed shell-like command into {op, key, value}.
 *   SET <key> <value...>
 *   GET <key>
 * Returns null if the command is unrecognized.
 */
export type ParsedCommand =
  | { op: "set"; key: string; value: string }
  | { op: "get"; key: string }
  | { op: "error"; message: string };

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  if (!trimmed) return { op: "error", message: "empty command" };
  const parts = trimmed.split(/\s+/);
  const verb = parts[0].toUpperCase();
  const enc = new TextEncoder();
  if (verb === "SET") {
    if (parts.length < 3) return { op: "error", message: "usage: SET <key> <value>" };
    const key = parts[1];
    const value = parts.slice(2).join(" ");
    // Use byte length (UTF-8) to match the WASM cap, not JS string length.
    if (enc.encode(key).length > 64) return { op: "error", message: "key too long (max 64 bytes)" };
    if (enc.encode(value).length > 192) return { op: "error", message: "value too long (max 192 bytes in demo build)" };
    return { op: "set", key, value };
  }
  if (verb === "GET") {
    if (parts.length !== 2) return { op: "error", message: "usage: GET <key>" };
    const key = parts[1];
    if (enc.encode(key).length > 64) return { op: "error", message: "key too long (max 64 bytes)" };
    return { op: "get", key };
  }
  return { op: "error", message: `unknown command '${verb}' - try SET or GET` };
}

/** Render a Uint8Array as a two-character hex array (no spaces, ASCII only). */
export function toHexBytes(buf: Uint8Array): string[] {
  const out: string[] = [];
  for (let i = 0; i < buf.length; i++) {
    out.push(buf[i].toString(16).padStart(2, "0"));
  }
  return out;
}
