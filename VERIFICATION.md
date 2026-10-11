# Initial preview verification

Verified on 11 October 2026 using Node.js 24.18.0, npm 12.0.2, Windows, and the Codex embedded Chromium browser.

| Check | Result |
| --- | --- |
| Clean locked installation (`npm ci`) | Passed |
| Production build and ESLint (`npm test`) | Passed |
| Vitest suite | 12 files, 94 tests passed |
| Dependency audit | Zero reported vulnerabilities |
| Notice verification, including built precache | 24 packages, 34 embedded notices, 4 fonts, 2 template assets verified |
| Notice verifier negative check | Deliberately incorrect retained-text hash rejected; original inventory restored |
| Dependency-change review | Only `source-map-js` changed, from 1.2.1 to 1.2.2 |
| Documentation links | All local Markdown/image links resolved |
| Publication-content review | No credential-pattern matches in staged source; artwork and invented fixtures reviewed; private working notes and generated output excluded |

## Browser checks

Using synthetic records, production assets passed text and URL creation, text editing, favorites, category creation/assignment, search, and persistence after direct-route reload. Exported version 2 backup data imported successfully into a separate origin with independent storage. Malformed JSON was rejected with recovery feedback; both restored QR records and their category assignment remained visible.

With the local host server unavailable, the previously installed production worker served the dashboard and direct routes. A new synthetic QR saved and survived reload, backup export reported success, and all four retained notice files remained readable from cache. This checks an unavailable application host, rather than disabling the operating system's network connection.

Behavioral smoke checks used the build before the cosmetic Settings version-label correction. The final build then passed the complete test suite and notice verification; a fresh browser origin confirmed `Version 0.1.0 (Initial preview)`.

## Limits and launch

The embedded browser's camera request remained pending, so browser camera-denial recovery was not established. Automated scanner denial/cleanup regressions passed. Physical camera/lens/torch, mobile installation/update, manual screen-reader behavior, browser storage eviction, and physical cross-device recovery remain unverified. Cross-origin restore is not a claim of physical cross-device recovery or a complete field-by-field cross-browser comparison.

The repository is prepared with fresh history on `main` and no remote. Publication, pushing, repository visibility, security-reporting activation, tagging, and deployment remain manual. Follow [PUBLICATION.md](PUBLICATION.md) before launch.
