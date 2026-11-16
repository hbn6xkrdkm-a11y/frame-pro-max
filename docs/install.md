# Install on a Samsung TV

The app uses Samsung's supported Tizen Developer Mode workflow. It is a separate app with its own identity, `ArtSaver01.Gallery`, and can coexist with your launcher. It declares Tizen 8.0 or newer; model and firmware differences can affect sideloading, discovery in Apps, and Samsung screen protection.

## 1. Prepare the TV and computer

1. Install [Tizen Studio and the TV extensions](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html). In its Package Manager, install **Web CLI**, **Samsung TV Extension**, and **Samsung Certificate Extension**. The scripts use Bash, Python 3, and `unzip`. On Windows, use the native SDK and the manual PowerShell commands below.
2. Put the TV and computer on the same local network. Open Samsung **Home → Apps** (on some models open **App Settings** within Apps), enter **12345**, enable **Developer Mode**, and set the host PC IP to your **computer's** local IPv4 address. Restart the TV as prompted. See [Samsung's TV device guide](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/tv-device.html).
3. Find the **TV's** local IPv4 address in its network settings. In a macOS/Linux shell:

   ```sh
   export TIZEN_STUDIO="$HOME/tizen-studio"  # Change if installed elsewhere.
   sdb="$TIZEN_STUDIO/tools/sdb"
   tizen="$TIZEN_STUDIO/tools/ide/bin/tizen"
   serial='TV_IP:26101'                     # Replace TV_IP with the TV's LAN address.
   "$sdb" connect "$serial"
   "$sdb" devices
   ```

   Copy the serial from the first column of the connected device row and use it for the remaining steps. See [connection troubleshooting](troubleshooting.md) if that row is missing.

## 2. Set up signing

1. In **Tizen Studio → Tools → Certificate Manager**, choose **+ → Samsung → TV**, or reuse your own existing Samsung TV profile if it already authorizes this TV.
2. Keep or create an author certificate. Complete Samsung sign-in in the official wizard. Create a **Public** Samsung distributor certificate and include the connected TV's Device Unique ID (DUID). See [Samsung's certificate guide](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html).
3. Confirm the profile is visible with `"$tizen" security-profiles list`. If your SDK expects a permit first, in **Device Manager** right-click the TV and select **Permit to install applications**. The install script also attempts to apply the permit.

Keep the certificate files, passwords, profile metadata, signed widgets, and DUID on your own machine. For updates, retain and back up the original author certificate.

## 3. Build, install, and open

Clone the project, then choose the release you want. To choose a specific later release, substitute its tag.

```sh
git clone https://github.com/hbn6xkrdkm-a11y/frame-pro-max.git
cd frame-pro-max
git switch --detach v1.0.1
profile='YOUR_SAMSUNG_PROFILE'
scripts/install-tv.sh install "$profile" "$serial"
```

The script validates the source, builds in a temporary folder, saves the signed widget to `dist/FrameProMax.wgt`, permits installation on your selected TV, installs it, and launches it. Use `scripts/install-tv.sh build "$profile"` to build and sign without contacting the TV.

### Manual workflow on Windows or with the release ZIP

The [release's unsigned ZIP](https://github.com/hbn6xkrdkm-a11y/frame-pro-max/releases/latest) contains the contents of `app/`. Extract the ZIP into a folder named `app` (with `app/config.xml` directly inside). A Git checkout already has this folder. In a PowerShell session opened **one level above** `app`:

```powershell
$sdk = 'C:\tizen-studio'
$sdb = Join-Path $sdk 'tools\sdb.exe'
$tizen = Join-Path $sdk 'tools\ide\bin\tizen.bat'
$serial = 'TV_IP:26101'
$profile = 'YOUR_SAMSUNG_PROFILE'
& $sdb connect $serial
& $sdb devices
& $tizen build-web -- app
& $tizen package -t wgt -s $profile -- app/.buildResult
Copy-Item 'app/.buildResult/Frame Pro Max.wgt' 'app/.buildResult/FrameProMax.wgt'
& $tizen install-permit -s $serial
& $tizen install -s $serial -n FrameProMax.wgt -- app/.buildResult
& $tizen run -s $serial -p ArtSaver01.Gallery
```

Stop if any command fails. Confirm the SDK and generated widget paths on your machine. The Tizen CLI prints its output filename if it differs. The same Tizen subcommands work in macOS/Linux with the binary selected above. See the [Samsung CLI reference](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/command-line-interface.html). The ZIP is unsigned; renaming it to `.wgt` does not sign it.

## 4. Verify it on your TV

1. Look for the gold frame and first painting. On the physical remote, tap **Right**, **Left**, **OK**, and **Back**. Reopen it from your custom launcher (or Samsung Apps if shown).
2. Let it run past the time your Samsung screensaver previously started. Check that paintings still rotate. Leave the gallery and check that normal Samsung idle behavior returns, with Auto Protection Time enabled.
3. Record the TV model, firmware, version, steps, and which checks passed. Keep network addresses, DUID, and certificate details out of public reports. On TVs whose SDB shell supports `vd_applist`, you can compare the app ID and version locally: `"$sdb" -s "$serial" shell 0 vd_applist`.

## Update or remove

- **Update:** check out a newer release. Use the **same author certificate** (and a valid distributor certificate for the TV). Rerun the install command. The app and package IDs must be preserved for an in-place update.
- **Remove:** `"$tizen" uninstall -s "$serial" -p ArtSaver01`. This targets only the gallery. Remove its shortcut from your custom launcher separately if needed.
- **Roll back:** an older widget can be rejected as a downgrade. If you really need a clean rollback, uninstall **the gallery** before installing the older signed version. Uninstall clears the gallery's local app data.
