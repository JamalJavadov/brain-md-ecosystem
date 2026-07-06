#!/bin/zsh
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="Codex Research Brain"
APP_DIR="/Applications/${APP_NAME}.app"
CONTENTS_DIR="${APP_DIR}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"
BUILD_DIR="${PROJECT_DIR}/.macos-build"
ICONSET_DIR="${BUILD_DIR}/AppIcon.iconset"
NODE_PATH="$(command -v node)"

cd "${PROJECT_DIR}"
npm run build

rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}" "${ICONSET_DIR}"

sed \
  -e "s|__PROJECT_PATH__|${PROJECT_DIR//|/\\|}|g" \
  -e "s|__NODE_PATH__|${NODE_PATH//|/\\|}|g" \
  "${PROJECT_DIR}/macos/CodexResearchBrain.swift" \
  > "${BUILD_DIR}/CodexResearchBrain.swift"

swiftc \
  -framework AppKit \
  -framework WebKit \
  "${BUILD_DIR}/CodexResearchBrain.swift" \
  -o "${BUILD_DIR}/CodexResearchBrain"

swift "${PROJECT_DIR}/macos/GenerateAppIcon.swift" "${BUILD_DIR}/AppIcon-1024.png"

sips -z 16 16 "${BUILD_DIR}/AppIcon-1024.png" --out "${ICONSET_DIR}/icon_16x16.png" >/dev/null
sips -z 32 32 "${BUILD_DIR}/AppIcon-1024.png" --out "${ICONSET_DIR}/icon_16x16@2x.png" >/dev/null
sips -z 32 32 "${BUILD_DIR}/AppIcon-1024.png" --out "${ICONSET_DIR}/icon_32x32.png" >/dev/null
sips -z 64 64 "${BUILD_DIR}/AppIcon-1024.png" --out "${ICONSET_DIR}/icon_32x32@2x.png" >/dev/null
sips -z 128 128 "${BUILD_DIR}/AppIcon-1024.png" --out "${ICONSET_DIR}/icon_128x128.png" >/dev/null
sips -z 256 256 "${BUILD_DIR}/AppIcon-1024.png" --out "${ICONSET_DIR}/icon_128x128@2x.png" >/dev/null
sips -z 256 256 "${BUILD_DIR}/AppIcon-1024.png" --out "${ICONSET_DIR}/icon_256x256.png" >/dev/null
sips -z 512 512 "${BUILD_DIR}/AppIcon-1024.png" --out "${ICONSET_DIR}/icon_256x256@2x.png" >/dev/null
sips -z 512 512 "${BUILD_DIR}/AppIcon-1024.png" --out "${ICONSET_DIR}/icon_512x512.png" >/dev/null
cp "${BUILD_DIR}/AppIcon-1024.png" "${ICONSET_DIR}/icon_512x512@2x.png"
iconutil -c icns "${ICONSET_DIR}" -o "${BUILD_DIR}/AppIcon.icns"

rm -rf "${APP_DIR}"
mkdir -p "${MACOS_DIR}" "${RESOURCES_DIR}"
cp "${BUILD_DIR}/CodexResearchBrain" "${MACOS_DIR}/CodexResearchBrain"
cp "${BUILD_DIR}/AppIcon.icns" "${RESOURCES_DIR}/AppIcon.icns"
cp "${PROJECT_DIR}/macos/Info.plist" "${CONTENTS_DIR}/Info.plist"

chmod +x "${MACOS_DIR}/CodexResearchBrain"
xattr -cr "${APP_DIR}"
codesign --force --deep --sign - "${APP_DIR}"
touch "${APP_DIR}"
rm -rf "${BUILD_DIR}"

echo "Installed ${APP_DIR}"
