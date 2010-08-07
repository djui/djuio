#!/usr/bin/env bash
set -e

patch -o ./server/lib/node-router.js ./server/vendor/node-router/lib/node-router.js ./patches/node-router.js.patch
patch -o ./server/lib/mustache.js ./server/vendor/mustache.js/mustache.js ./patches/mustache.js.patch
patch -o ./server/lib/rfc3339date.js ./server/vendor/rfc3339date.js/rfc3339date.js ./patches/rfc3339date.js.patch
