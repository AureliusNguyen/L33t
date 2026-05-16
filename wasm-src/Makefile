# Build the wasm core. Requires emsdk activated:
#   source $HOME/emsdk/emsdk_env.sh

EMCC ?= emcc
OUT_DIR := ../lib/wasm

all: $(OUT_DIR)/l33t-core.js

$(OUT_DIR)/l33t-core.js: l33t-core.c
	mkdir -p $(OUT_DIR)
	$(EMCC) -O3 l33t-core.c \
	  -s EXPORTED_FUNCTIONS='["_kv_init","_kv_reset","_bench_one_op","_malloc","_free"]' \
	  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","HEAPU8"]' \
	  -s MODULARIZE=1 -s EXPORT_ES6=1 \
	  -s ENVIRONMENT=web -s ALLOW_MEMORY_GROWTH=1 \
	  -s SINGLE_FILE=1 \
	  -o $(OUT_DIR)/l33t-core.js

clean:
	rm -f $(OUT_DIR)/l33t-core.js $(OUT_DIR)/l33t-core.wasm
