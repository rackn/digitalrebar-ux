#!/bin/bash

set -e

if ! [[ -x public ]]; then
    echo "digitalrebar-ux has not been built!"
    exit 1
fi

case $(uname -s) in
    Darwin)
        shasum="command shasum -a 256";;
    Linux)
        shasum="command sha256sum";;
    *)
        # Someday, support installing on Windows.  Service creation could be tricky.
        echo "No idea how to check sha256sums"
        exit 1;;
esac


tmpdir="$(mktemp -d /tmp/rs-bundle-XXXXXXXX)"
cp -a public "$tmpdir"
(
    cd "$tmpdir"
    $shasum $(find . -type f) >sha256sums
    zip -p -r dr-ux.zip *
)

cp "$tmpdir/dr-ux.zip" .
$shasum dr-ux.zip > dr-ux.sha256
rm -rf "$tmpdir"
