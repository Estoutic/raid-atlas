#!/bin/zsh
set -euo pipefail
TASK_ROOT="${0:A:h}"
VERSION=$(<"$TASK_ROOT/VERSION")
OUT="$TASK_ROOT/releases"
mkdir -p "$OUT" "$TASK_ROOT/cache"
STAGE=$(mktemp -d "$TASK_ROOT/cache/dmg-stage.XXXXXX")
trap 'rm -rf "$STAGE"' EXIT
chmod 755 "$STAGE"
RAID_ATLAS_BUNDLE="$STAGE/Raid Atlas.app" zsh "$TASK_ROOT/build.sh"
codesign --verify --deep --strict "$STAGE/Raid Atlas.app"
ln -s /Applications "$STAGE/Applications"
cp "$TASK_ROOT/packaging/Установка.txt" "$STAGE/Установка.txt"
DMG="$OUT/Raid-Atlas-$VERSION-mac-universal.dmg"
hdiutil create -volname 'Raid Atlas' -srcfolder "$STAGE" -format UDZO -imagekey zlib-level=9 -ov "$DMG"
hdiutil verify "$DMG"
(cd "$OUT" && shasum -a 256 "${DMG:t}" > "${DMG:t}.sha256")
echo "$DMG"
