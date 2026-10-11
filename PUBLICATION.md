# Validation and manual release checklist

## Source checks

Use Node.js 24.x and npm 12.x in a fresh checkout:

```sh
npm ci
npm test
npm run notices:check
npm audit --audit-level=moderate
npm run preview -- --host 127.0.0.1
```

The preview uses the existing production build. Open the exact URL Vite prints. Use an isolated browser profile and invented data; avoid your everyday library.

## Browser smoke test

1. Create a text QR named `Release Demo` containing `Synthetic demo only`, and a URL QR for `https://example.com`. Edit the text record, reload, and confirm persistence.
2. Create a category, assign a record, favorite it, and check dashboard search/filtering. Reload a direct `/settings` or `/detail/:id` URL.
3. Export a backup from Settings. In a separate isolated profile, import it and compare QR content, category references, styles, favorites, dates, and settings. `public/synthetic-demo-backup.json` is an additional invented fixture.
4. Try malformed JSON, an unsupported version, and an invalid record. Confirm visible feedback and that the entire existing library remains unchanged. Unit tests separately exercise transaction rollback and size limits.
5. Deny camera permission on the scanner. Confirm recovery feedback and that leaving the page releases any camera resources. Successful physical scanning, camera switching, and torch support require hardware checks.
6. Complete the first online service-worker installation. Reload until the worker controls the page, disable network, then reload and check local creation, browsing, and backup.
7. While offline, open `/third-party/LICENSES.txt`, `/third-party/EMBEDDED-NOTICES.txt`, `/third-party/inventory.json`, and `/fonts/OFL-Inter.txt`; confirm the complete notices remain readable.
8. Check keyboard navigation, visible focus, labels, and dialog Escape/focus behavior at desktop and narrow mobile widths. Record manual screen-reader checks separately.

Offline results apply to the tested origin and browser. Physical camera, mobile installation/update, screen-reader behavior, storage eviction, and physical cross-device recovery remain unverified until tested on the actual platforms.

## Before public launch

- Review the committed file list, documentation, screenshots, QR fixtures, licenses, and dependency audit. Exclude private notes, populated libraries, credentials, local configuration, and previous private history.
- Keep the MIT license, font terms, and complete `public/third-party/` notices in source and built output. Run notice verification after any dependency or retained-text change.
- Choose the intended GitHub destination and ensure README clone links match it. This source package uses `PatzMain/QRFOLIO` as the intended upstream name.
- Enable GitHub private vulnerability reporting before making the repository public. Verify the Security reporting flow described in `SECURITY.md` is available.
- Enable Issues and Actions; require the source-check workflow for pull requests when configuring branch protection.
- Review the local initial commit, configure the remote yourself, and push only the clean repository. The original private repository's history is outside this release.
- Publish version `0.1.0` as an initial preview if desired. Describe verified behavior and known platform limits without implying device certification.
- For deployment, use a trusted HTTPS origin root and repeat deep-link, offline, camera-permission, and update checks on that host.

Repository creation, pushing, visibility changes, tagging, and deployment are manual launch actions.
