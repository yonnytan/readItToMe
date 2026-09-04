#!/usr/bin/env bash
# Renders the Chrome Web Store graphics from the HTML scenes in store/assets/src.
# Requires Google Chrome (headless). Re-run after editing a scene.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$chrome" ] || { echo "Google Chrome not found at $chrome"; exit 1; }

shot() { # <scene.html> <out.png> <width> <height>
  local tmp; tmp="$(mktemp -d)"
  "$chrome" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --allow-file-access-from-files --user-data-dir="$tmp" \
    --virtual-time-budget=1500 --window-size="$3,$4" \
    --screenshot="$root/store/assets/$2" "file://$root/store/assets/src/$1" >/dev/null 2>&1 || true
  rm -rf "$tmp"
  echo "store/assets/$2 ($3x$4)"
}

shot screenshot-1.html screenshot-1.png 1280 800 &
shot screenshot-2.html screenshot-2.png 1280 800 &
shot screenshot-3.html screenshot-3.png 1280 800 &
shot promo-440x280.html promo-440x280.png 440 280 &
shot promo-1400x560.html promo-1400x560.png 1400 560 &
wait
echo "done"

# The Chrome Web Store rejects alpha in screenshots and promo tiles, so ship
# flattened JPEGs alongside the PNGs.
for f in screenshot-1 screenshot-2 screenshot-3 promo-440x280 promo-1400x560; do
  sips -s format jpeg -s formatOptions 92 "$root/store/assets/$f.png" \
    --out "$root/store/assets/$f.jpg" >/dev/null
  echo "store/assets/$f.jpg"
done
