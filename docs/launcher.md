# Use the gallery with a custom TV launcher

The public gallery has its own signed widget identity:

| Field | Value |
| --- | --- |
| Display name | Frame Pro Max |
| Application ID for launch | `ArtSaver01.Gallery` |
| Package ID for uninstall | `ArtSaver01` |

## Add a shortcut

After installing the gallery on the same TV, refresh your launcher's installed app list. Look for **Frame Pro Max** and pin it. If your launcher accepts explicit app IDs, use `ArtSaver01.Gallery`. Verify with the physical remote: open the shortcut, advance an artwork, and Back out.

If the launcher is a Tizen web app you maintain, it can attempt launch through [Tizen's Application API](https://developer.samsung.com/smarttv/develop/api-references/tizen-web-device-api-references/application-api.html). The launch privilege belongs in the **launcher** manifest, not in the gallery:

```xml
<tizen:privilege name="http://tizen.org/privilege/application.launch"/>
```

```js
function openArtGallery(showStatus) {
  try {
    tizen.application.launch('ArtSaver01.Gallery', undefined, () => {
      showStatus('Could not open the art gallery. Check that it is installed.');
    });
  } catch {
    showStatus('Could not open the art gallery. Check that it is installed.');
  }
}
```

Some launchers and firmware builds restrict discovery or app launches. If it is missing from the list, check the app by launching it directly with [Tizen CLI](install.md#3-build-install-and-open). After Back, the TV controls which app or system screen is visible. Test return behavior on your device.

## Optional launcher idle timer

If you maintain the other launcher and want it to open the gallery automatically, implement the timer **in that launcher** while its home screen is visible. Reset it on user input, cancel it when hidden, and leave the default off until the owner enables it. Prefer 5–30 minutes. Cancel any pending launch when the user is opening another app or editing settings. Route the timer through the same launch function as a manual shortcut so both paths handle missing installs.

The gallery starts on launch, so it needs no remote automation. This can only cover idle time your launcher observes. This repo makes no changes to Samsung's Home button, system settings, firmware, or protection while another app is playing.
