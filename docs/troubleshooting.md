# Troubleshooting

| Symptom | What to check |
| --- | --- |
| `sdb connect` is refused or the TV is missing | Enable Developer Mode, use the **computer's** LAN IPv4 as host IP, restart the TV, and connect to the **TV's** current LAN IPv4 at port 26101. Keep both on the same LAN; a guest network can isolate devices. |
| Samsung is missing in Certificate Manager | Install **Samsung Certificate Extension**, then restart Tizen Studio. Choose **Samsung → TV**, not the general Tizen certificate wizard. |
| The CLI can't find the profile | Run `tizen security-profiles list` using the same SDK as the installer. Verify the profile has both author and distributor certificates. |
| Device permit or install fails | In Device Manager select **Permit to install applications**. The Samsung distributor certificate must include this TV's DUID. A release ZIP must be signed locally. Check the declared minimum Tizen version and keep the package filename free of spaces. |
| Updating fails | Install a higher version signed by the original author. If the author certificate was lost, a clean reinstall of the gallery is needed. |
| Gallery isn't in my launcher | Refresh its installed apps, use `ArtSaver01.Gallery` if it supports explicit IDs, and try a direct Tizen CLI launch. Discoverability depends on the launcher and TV. |
| Samsung's saver appears over the running gallery | Test on the real TV, note its model and firmware, and confirm `webapis.appcommon` is available. Samsung says API toggling has no effect when Auto Protection Time is disabled. Screenshots or a browser pass cannot prove this device feature works. |
| Gallery doesn't start when another app is idle | Start it manually, or add an idle trigger inside a custom launcher's own foreground home screen. A sideloaded web app cannot monitor idle time in a different foreground app. |
| The browser says “Gallery unavailable” | Serve `app/` over HTTP with the [preview command](workflows.md#preview-in-a-browser). Running the HTML directly from disk can block the manifest fetch. |
| The gallery skips a custom picture | Confirm the filename, exact casing, JPEG format, and manifest entry; run `python3 scripts/bundle.py --check`. |

For a public issue, share your widget release, TV model and firmware, exact steps, and the relevant error with private values removed. Do not paste signing configuration, signed archives, LAN IPs, or device identifiers.
