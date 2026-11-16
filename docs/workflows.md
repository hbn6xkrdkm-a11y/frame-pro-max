# Development and release workflows

## Preview in a browser

From the repo root, run:

```sh
python3 -m http.server 8080 --bind 127.0.0.1 --directory app
```

Open <http://127.0.0.1:8080>. The browser has arrow, info, and fullscreen buttons as well as keyboard controls. The app loads only bundled files at runtime. No environment file, API key, launcher checkout, or SDK is needed for the preview.

## Edit the gallery

- `app/index.html` contains the frame, clock, artwork caption, controls, and restart view.
- `app/gallery.css` is the visual layer. Keep animation to opacity and a small transform on the displayed image. Keep captions transient and preserve the reduced-motion fallback.
- `app/gallery.js` handles inputs, the two image layers, the playback clock, lifecycle, and Samsung AppCommon. The browser path runs without Samsung's SDK.
- `app/assets/art/manifest.json` is the ordered catalog. Add or remove the matching JPEG and its entry together. See [artwork.md](artwork.md).
- `app/config.xml` defines the Samsung widget. Keep `ArtSaver01.Gallery` and `ArtSaver01` to support updates and existing launcher shortcuts.

## Verify changes

```sh
npm ci
npx playwright install chromium
npm run check
npm test
```

CI runs these checks and builds an unsigned ZIP for review. The tests cover keyboard control and restart, rotation and reduced motion, the placeholder Samsung API's OFF/ON calls, and the missing-image fallback. The unsigned app and browser need no npm dependencies at runtime.

Use [the physical TV checklist](install.md#4-verify-it-on-your-tv) when changing playback, remote keys, or Samsung calls. Report which tests ran in Chromium, which used a Samsung mock, and which were observed on a physical TV.

## Prepare a release

1. Bump the version in `app/config.xml` and keep `package.json` and `package-lock.json` in sync (`npm version VERSION --no-git-tag-version`). Update the quickstart tag if the release becomes the recommended install. Keep both IDs.
2. Run the browser checks, then build locally with `scripts/install-tv.sh build YOUR_SAMSUNG_PROFILE`. Use the install mode only for a TV you're authorized to update. Document any firmware checks that still need to happen.
3. Make an unsigned release ZIP and checksums:

   ```sh
   version="$(python3 scripts/bundle.py --version)"
   bundle="FrameProMax-$version-unsigned.zip"
   python3 scripts/bundle.py --output "dist/$bundle"
   (cd dist && shasum -a 256 "$bundle" > SHA256SUMS.txt)
   ```

   On Linux you can substitute `sha256sum`. Verify with `shasum -a 256 -c SHA256SUMS.txt` from the download folder.
4. Tag the reviewed commit as `v$version`. Publish the unsigned ZIP and checksum with release notes. Use explicit asset paths; do not publish `dist/` wholesale. The signed widget and credentials stay local. Release documentation should identify known TV models and distinguish device results from tests.

## Publish the demo

The Pages workflow publishes the validated files in `app/` from pushes to `main`. It does not install anything on a TV. For a fork, enable **Settings → Pages → Source: GitHub Actions**, update the docs links to the fork, and run the **Browser demo** workflow. If the fork is only for personal development, the local preview works without Pages.
