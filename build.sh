#!/bin/zsh
set -euo pipefail
TASK_ROOT="${0:A:h}"
VERSION=$(<"$TASK_ROOT/VERSION")
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  print -u2 'VERSION must contain major.minor.patch'; exit 1
fi
BUNDLE="${RAID_ATLAS_BUNDLE:-$TASK_ROOT/dist/Raid Atlas.app}"
mkdir -p "$BUNDLE/Contents/Resources/web/data/thumbs" "$BUNDLE/Contents/MacOS" "$BUNDLE/Contents/Resources/web/data" "$TASK_ROOT/cache"
for arch in arm64 x86_64; do
  swiftc -O -target "$arch-apple-macosx12.0" -module-cache-path "$TASK_ROOT/cache" -framework Cocoa -framework WebKit "$TASK_ROOT/app/Main.swift" -o "$TASK_ROOT/cache/RaidAtlas-$arch"
done
lipo -create "$TASK_ROOT/cache/RaidAtlas-arm64" "$TASK_ROOT/cache/RaidAtlas-x86_64" -output "$BUNDLE/Contents/MacOS/RaidAtlas"
cp "$TASK_ROOT/app/web/"*.js "$TASK_ROOT/app/web/"*.css "$TASK_ROOT/app/web/"*.html "$BUNDLE/Contents/Resources/web/"
cp "$TASK_ROOT/app/web/brand-icon.png" "$BUNDLE/Contents/Resources/web/"
cp "$TASK_ROOT/app/assets/AppIcon.icns" "$BUNDLE/Contents/Resources/"
cp "$TASK_ROOT/app/web/data/factory-web-render.png" "$TASK_ROOT/app/web/data/customs-web-render.png" "$TASK_ROOT/app/web/data/customs-classic-render.png" "$BUNDLE/Contents/Resources/web/data/"
cp "$TASK_ROOT/app/web/data/"*-web-render.jpg "$BUNDLE/Contents/Resources/web/data/"
cp "$TASK_ROOT/app/web/data/thumbs/"*.jpg "$BUNDLE/Contents/Resources/web/data/thumbs/"
cat > "$BUNDLE/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleExecutable</key><string>RaidAtlas</string><key>CFBundleIdentifier</key><string>local.raidatlas.mac</string><key>CFBundleName</key><string>Raid Atlas</string><key>CFBundleDisplayName</key><string>Raid Atlas</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleIconFile</key><string>AppIcon</string><key>CFBundleShortVersionString</key><string>$VERSION</string><key>CFBundleVersion</key><string>$VERSION</string><key>LSMinimumSystemVersion</key><string>12.0</string><key>NSHighResolutionCapable</key><true/><key>NSHumanReadableCopyright</key><string>Noncommercial preview. Map art: RE3MR, Shebuka and tarkov.dev community, CC BY-NC-SA 4.0. Factory 3D: TKL, CC BY-NC-ND 4.0. Game: Battlestate Games.</string></dict></plist>
PLIST
cp "$TASK_ROOT/THIRD_PARTY.md" "$BUNDLE/Contents/Resources/THIRD_PARTY.md"
cp "$TASK_ROOT/sources/svg-readme.md" "$BUNDLE/Contents/Resources/SVG-NOTICE.md"
mkdir -p "$BUNDLE/Contents/Resources/licenses"
cp "$TASK_ROOT/app/web/vendor/"*.txt "$BUNDLE/Contents/Resources/licenses/"
cp "$TASK_ROOT/sources/tkl/manifest.json" "$BUNDLE/Contents/Resources/licenses/TKL-MODELS.json"
codesign --force --sign - "$BUNDLE"
echo "$BUNDLE"
