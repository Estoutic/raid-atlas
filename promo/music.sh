#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p cache/promo-v2/music
curl --fail --location --retry 3 \
  https://www.scottbuckley.com.au/wp-content/audio/sb_venom.mp3 \
  --output cache/promo-v2/music/venom.mp3
printf '%s\n' 'e7310bb677f9a44ca57c2baa72a68fe955f7d36995eba476e1c8400ca7d09ac7  cache/promo-v2/music/venom.mp3' | shasum -a 256 -c -
