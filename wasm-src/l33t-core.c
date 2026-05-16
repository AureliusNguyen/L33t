/*
 * l33t-core: hashtable + protocol parser, networking stripped.
 * Compiled to wasm via emscripten for the in-browser RTT slider widget.
 *
 * Exports (called from JS via cwrap):
 *   kv_init(size_t buckets)         - allocate the hash table
 *   kv_reset()                      - clear all entries
 *   bench_one_op(uint8_t* buf, size_t len) -> double nanoseconds
 *
 * Protocol (matches l33t-server-epoll):
 *   request:  1B op | 2B BE key_len | key | (SET only) 2B BE val_len | val
 *   ops:      0x01 = SET, 0x02 = GET
 *   response is not produced; we only measure parse + lookup/insert work.
 */
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <emscripten/emscripten.h>

#define OP_SET 0x01
#define OP_GET 0x02

typedef struct {
    uint8_t state;   /* 0 empty, 1 occupied, 2 tombstone */
    uint16_t klen;
    uint16_t vlen;
    char data[256];  /* inline key+value, bounded for browser memory */
} bucket_t;

static bucket_t* ht = NULL;
static size_t ht_size = 0;

static uint32_t fnv1a(const char* s, size_t n) {
    uint32_t h = 2166136261u;
    for (size_t i = 0; i < n; i++) {
        h ^= (uint8_t)s[i];
        h *= 16777619u;
    }
    return h;
}

EMSCRIPTEN_KEEPALIVE
void kv_init(size_t buckets) {
    if (ht) free(ht);
    ht_size = buckets;
    ht = calloc(buckets, sizeof(bucket_t));
}

EMSCRIPTEN_KEEPALIVE
void kv_reset(void) {
    if (ht) memset(ht, 0, ht_size * sizeof(bucket_t));
}

static int kv_set(const char* k, uint16_t klen, const char* v, uint16_t vlen) {
    if (!ht || klen > 64 || vlen > 192) return -1;
    uint32_t h = fnv1a(k, klen);
    for (size_t i = 0; i < ht_size; i++) {
        size_t idx = (h + i) % ht_size;
        bucket_t* b = &ht[idx];
        if (b->state == 1 && b->klen == klen && memcmp(b->data, k, klen) == 0) {
            b->vlen = vlen;
            memcpy(b->data + klen, v, vlen);
            return 0;
        }
        if (b->state != 1) {
            b->state = 1;
            b->klen = klen;
            b->vlen = vlen;
            memcpy(b->data, k, klen);
            memcpy(b->data + klen, v, vlen);
            return 0;
        }
    }
    return -1;
}

static int kv_get(const char* k, uint16_t klen) {
    if (!ht || klen > 64) return -1;
    uint32_t h = fnv1a(k, klen);
    for (size_t i = 0; i < ht_size; i++) {
        size_t idx = (h + i) % ht_size;
        bucket_t* b = &ht[idx];
        if (b->state == 0) return -1;
        if (b->state == 1 && b->klen == klen && memcmp(b->data, k, klen) == 0) return 0;
    }
    return -1;
}

/*
 * Time a tight loop of `iters` parse+execute cycles for the provided op.
 * Returns total elapsed nanoseconds. JS divides by `iters` for per-op time.
 *
 * Browser clock resolution (~1ms via perf.now without COOP/COEP) makes
 * single-op timing return 0; batching to ~100k iters pulls the total into
 * the measurable range while still using the real WASM hashtable.
 */
EMSCRIPTEN_KEEPALIVE
double bench_batch(uint8_t* buf, size_t len, int iters) {
    if (len < 3 || iters <= 0) return 0;
    struct timespec t0, t1;
    clock_gettime(CLOCK_MONOTONIC, &t0);
    for (int n = 0; n < iters; n++) {
        uint8_t op = buf[0];
        uint16_t klen = ((uint16_t)buf[1] << 8) | buf[2];
        if (3 + klen > len) continue;
        const char* k = (const char*)(buf + 3);
        if (op == OP_SET) {
            if (3 + klen + 2 > len) continue;
            uint16_t vlen = ((uint16_t)buf[3 + klen] << 8) | buf[3 + klen + 1];
            if (3 + klen + 2 + vlen > len) continue;
            const char* v = (const char*)(buf + 3 + klen + 2);
            kv_set(k, klen, v, vlen);
        } else if (op == OP_GET) {
            kv_get(k, klen);
        }
    }
    clock_gettime(CLOCK_MONOTONIC, &t1);
    return (double)(t1.tv_sec - t0.tv_sec) * 1e9
         + (double)(t1.tv_nsec - t0.tv_nsec);
}

/*
 * Run one op and return a struct of (ok, response_kind) packed into the
 * return value. Used by the interactive terminal to surface the result.
 *   bit 0 (ok): 1 if op completed, 0 on parse error
 *   bit 1-2 (response): 0=OK, 1=VALUE, 2=NOT_FOUND
 */
EMSCRIPTEN_KEEPALIVE
int exec_one_op(uint8_t* buf, size_t len) {
    if (len < 3) return 0;
    uint8_t op = buf[0];
    uint16_t klen = ((uint16_t)buf[1] << 8) | buf[2];
    if (3 + klen > len) return 0;
    const char* k = (const char*)(buf + 3);
    if (op == OP_SET) {
        if (3 + klen + 2 > len) return 0;
        uint16_t vlen = ((uint16_t)buf[3 + klen] << 8) | buf[3 + klen + 1];
        if (3 + klen + 2 + vlen > len) return 0;
        const char* v = (const char*)(buf + 3 + klen + 2);
        return kv_set(k, klen, v, vlen) == 0 ? 0x01 : 0;
    } else if (op == OP_GET) {
        int r = kv_get(k, klen);
        return r == 0 ? (0x01 | (0x01 << 1)) : (0x01 | (0x02 << 1));
    }
    return 0;
}

/* Parse + execute one op from the provided buffer. Returns elapsed nanoseconds. */
EMSCRIPTEN_KEEPALIVE
double bench_one_op(uint8_t* buf, size_t len) {
    if (len < 3) return 0;
    struct timespec t0, t1;
    clock_gettime(CLOCK_MONOTONIC, &t0);
    uint8_t op = buf[0];
    uint16_t klen = ((uint16_t)buf[1] << 8) | buf[2];
    if (3 + klen > len) return 0;
    const char* k = (const char*)(buf + 3);
    if (op == OP_SET) {
        if (3 + klen + 2 > len) return 0;
        uint16_t vlen = ((uint16_t)buf[3 + klen] << 8) | buf[3 + klen + 1];
        if (3 + klen + 2 + vlen > len) return 0;
        const char* v = (const char*)(buf + 3 + klen + 2);
        kv_set(k, klen, v, vlen);
    } else if (op == OP_GET) {
        kv_get(k, klen);
    }
    clock_gettime(CLOCK_MONOTONIC, &t1);
    return (double)(t1.tv_sec - t0.tv_sec) * 1e9
         + (double)(t1.tv_nsec - t0.tv_nsec);
}
