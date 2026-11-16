# Working on Fancy TV Screensaver

This repo is a standalone Samsung Tizen fine-art gallery. Start at [README](README.md), then use the [development workflow](docs/workflows.md) and [TV install guide](docs/install.md). No private launcher repo or local machine configuration is needed.

- Keep plain HTML/CSS/JS in `app/` and the browser usable without `tizen` or `webapis`. Artwork must be bundled, with per-file public redistribution provenance in the manifest. Keep network access optional for developers and out of runtime code.
- Keep `ArtSaver01.Gallery` and package `ArtSaver01` stable. On release, increase the widget version and sign updates with the same author certificate. Keep signing and device data local.
- **Protection invariant:** request Samsung OFF only when a real slide is showing in the foreground. Request ON on exit, visibility loss, page hide, or failed playback. Test both sides of any changes. Do not introduce a global setting change or retain the protection override while idle on a static fallback.
- Preserve Left, Right, OK, Back, accessible browser controls, and reduced motion. Use the two slide layers for opacity crossfades and avoid repaint-heavy effects.
- Run `npm ci`, `npx playwright install chromium`, `npm run check`, and `npm test`. See the [physical TV checklist](docs/install.md#4-verify-it-on-your-tv) for findings that cannot be inferred from the mock.
- Do not install to a physical TV without the owner's authorization. Record browser, mock, packaging, and physical results separately. Never commit signed widgets, SDK credentials, signing profiles, device IDs, private URLs, or LAN values. Release only the allowlisted unsigned ZIP and checksum.

| If changing… | Read or run… |
| --- | --- |
| Timings, remote, background behavior | `app/gallery.js`, `tests/gallery.spec.js`, [Samsung AppCommon](https://developer.samsung.com/smarttv/develop/guides/fundamentals/setting-screensaver.html) |
| Artwork | [Credits and curation](docs/artwork.md), `python3 scripts/bundle.py --check` |
| Launch from a different project | [Launcher integration](docs/launcher.md) |
| SDK installation, signing, releases | [Install](docs/install.md) and [release workflow](docs/workflows.md#prepare-a-release) |
