# Artwork credits and reuse

The bundled works are sourced from the Art Institute of Chicago. Each one was selected from an API record marked `is_public_domain: true`; the image is available under the museum's [Open Access terms](https://www.artic.edu/open-access/open-access-images). See the museum's [API documentation](https://api.artic.edu/docs/#licensing) for the public-domain flag and IIIF explanations. Each catalog entry lists the work, artist, date, institution, rights, museum object page, and source image.

The gallery bundles resized JPEG derivatives and crops them to fill the screen. The [preview](gallery-preview.jpg) shows Hokusai's [The Great Wave off Kanagawa](https://www.artic.edu/artworks/24645), from the same collection. The MIT license applies to the app code and original graphics; the artwork reproductions are covered by their separate rights.

## Replace or add a work

1. Choose a work you have permission to redistribute. For museum images, confirm rights on the institution's record for **that specific image**. A publicly viewable image is not necessarily available for redistribution.
2. Make a JPEG, about 1,600–1,900 pixels wide for landscape images, using a simple name such as `my-landscape.jpg`. Avoid bundling EXIF location or personal metadata.
3. Copy it into `app/assets/art/`. Add an entry to `manifest.json` with `file`, `title`, `artist`, `date`, `credit`, `rights`, `source`, and `image`. The last two fields are provenance links; playback uses the local file. Move the entry within the array to change its position.
4. Run `python3 scripts/bundle.py --check` and preview the collection. Check the crop at TV aspect ratio and ensure the title is legible from a distance. Adjust tests if changing one of the artworks used as a playback fixture.
