#!/usr/bin/env bash
# Build with your own Samsung profile. Only "install" contacts the selected TV.
set -euo pipefail

usage() {
  cat <<'HELP'
Usage:
  scripts/install-tv.sh build PROFILE
  scripts/install-tv.sh install PROFILE SDB_SERIAL

Set TIZEN_STUDIO if the SDK is outside ~/tizen-studio. Use the serial from
sdb devices. Build creates dist/FrameProMax.wgt and does not contact a TV.
Install builds, permits installation, installs on that serial, and launches.
HELP
}

if [[ ${1:-} == -h || ${1:-} == --help ]]; then usage; exit 0; fi
if [[ $# -eq 2 && $1 == build && -n $2 ]]; then
  mode=build
elif [[ $# -eq 3 && $1 == install && -n $2 && -n $3 ]]; then
  mode=install
else
  usage >&2
  exit 2
fi

root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
sdk="${TIZEN_STUDIO:-$HOME/tizen-studio}"
tizen="$sdk/tools/ide/bin/tizen"
sdb="$sdk/tools/sdb"
profile="$2"
if [[ ! -x "$tizen" ]]; then
  printf 'Tizen Web CLI not found. Install Web CLI and set TIZEN_STUDIO to the SDK directory.\n' >&2
  exit 1
fi
if [[ $mode == install ]]; then
  serial="$3"
  if [[ ! -x "$sdb" ]] || ! "$sdb" devices | awk -v serial="$serial" '$1 == serial && $2 == "device" { found=1 } END { exit !found }'; then
    printf 'The requested device is not connected. Run sdb connect and check sdb devices.\n' >&2
    exit 1
  fi
fi

stage="$(mktemp -d "${TMPDIR:-/tmp}/frame-pro-max.XXXXXXXX")"
trap 'rm -rf -- "$stage"' EXIT
python3 "$root/scripts/bundle.py" --stage "$stage/app"
"$tizen" build-web -- "$stage/app"
mkdir -p "$stage/signed"
"$tizen" package -t wgt -s "$profile" -o "$stage/signed" -- "$stage/app/.buildResult"
shopt -s nullglob
widgets=("$stage/signed/"*.wgt)
if [[ ${#widgets[@]} -ne 1 ]]; then
  printf 'Expected one signed widget. Inspect the Tizen packaging output above.\n' >&2
  exit 1
fi
unzip -tq "${widgets[0]}"
for signature in author-signature.xml signature1.xml; do
  unzip -p "${widgets[0]}" "$signature" >/dev/null
done
mkdir -p "$root/dist"
cp "${widgets[0]}" "$root/dist/FrameProMax.wgt"
printf 'Signed widget: %s\n' "$root/dist/FrameProMax.wgt"

if [[ $mode == install ]]; then
  "$tizen" install-permit -s "$serial"
  "$tizen" install -s "$serial" -n FrameProMax.wgt -- "$root/dist"
  "$tizen" run -s "$serial" -p ArtSaver01.Gallery
fi
