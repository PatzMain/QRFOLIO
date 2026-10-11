# Source license and third-party terms

Owned application code and documentation use the root [MIT license](LICENSE), Copyright (c) 2026 PatzMain. Third-party licenses and required attributions remain applicable to their respective material.

## Dependencies

`public/third-party/LICENSES.txt` retains complete package license and notice texts for the installed production dependency closure and traced browser/service-worker modules. `EMBEDDED-NOTICES.txt` retains upstream legal comment blocks, including QR generator and ZXing authors. `inventory.json` records exact locked versions, integrity values, and retained-text hashes.

Keep these files in source and built distributions. Build-only tooling is outside this browser distribution inventory. Run `npm run notices:check` after installation and review the inventory after any lockfile change. See [CONTRIBUTING.md](CONTRIBUTING.md) for the update procedure.

Complete publisher MIT texts supplement abbreviated Kazuhiko Arase and Project Nayuki generator banners. Their provenance is recorded separately in the inventory; the supplemental texts do not assert that current publisher code equals the locked historical bundle.

## Fonts

The four `public/fonts/inter-{400,500,600,700}.woff2` files match the corresponding `inter-latin-{weight}-normal.woff2` files from `@fontsource/inter` 5.2.8. They are Copyright 2016 The Inter Project Authors and licensed under the SIL Open Font License 1.1. Keep the complete terms at `public/fonts/OFL-Inter.txt` with the fonts. The application MIT license does not replace these terms.

Publisher: [Inter](https://github.com/rsms/inter). Package: [@fontsource/inter 5.2.8](https://www.npmjs.com/package/@fontsource/inter/v/5.2.8).

## Artwork and template assets

The maintainer created the app-specific icons, screenshots, and hero artwork using AI image generation. New contributed artwork requires its own provenance and redistribution review.

`src/assets/react.svg` and `src/assets/vite.svg` match the create-vite 9.1.0 React template at Vite commit `4ae9e14f2c4db0706b2e9d815656e050accbd2bf`. Complete publisher MIT/upstream terms are retained in `public/third-party/LICENSES.txt`. The inventory records immutable source URLs, Git blob identifiers, and asset/license hashes.

## Offline notice access

After the initial online production service-worker installation, the application precaches `/third-party/LICENSES.txt`, `/third-party/EMBEDDED-NOTICES.txt`, `/third-party/inventory.json`, and `/fonts/OFL-Inter.txt`. Accepted application updates refresh changed notice revisions. Initial loading requires network access, and browser storage eviction can remove cached files.
