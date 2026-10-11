# Architecture

QRFolio is a static React application built with TypeScript and Vite. It has no application backend or authentication service. Tailwind CSS supplies styling, Framer Motion supplies transitions, and Dexie wraps browser IndexedDB.

## Application structure

- `src/app/`: application shell, lazy route definitions, database initialization, and theme provider.
- `src/features/`: dashboard, generator, scanner, QR details, categories, and settings.
- `src/shared/`: UI and layout components, hooks, QR encoding/parsing, validation, persistence, backup utilities, constants, and types.
- `src/tests/`: shared test setup and responsive-layout checks. Feature and utility tests also live beside their source.
- `public/`: PWA icons, screenshots, self-hosted fonts, synthetic backup fixture, and third-party notices.

Global styling is in `src/index.css`. The dashboard owns library search and filtering; there is no separate search route.

## Routing and QR workflows

React Router lazily loads `/`, `/categories`, `/settings`, `/generate`, `/edit/:id`, `/detail/:id`, and `/scan`. Static hosting must fall back to `index.html` for those routes. The build separates the camera scanner dependency into its own chunk.

The generator encodes typed form metadata into QR content and saves validated records through shared persistence helpers. Details support editing, sharing, image download, and external actions. The scanner uses `html5-qrcode`, parses results into supported types, and releases camera resources when stopped or unmounted. External destinations are checked against type-specific allowed schemes; scanned URLs require confirmation.

## Persistence and backups

`QRFolioDatabase` uses Dexie schema version 1 with three tables:

| Table | Primary key | Indexed fields / purpose |
| --- | --- | --- |
| `qrcodes` | `id` | `title`, `type`, `categoryId`, `isFavorite`, `createdAt`, `updatedAt` |
| `categories` | `id` | `name`, `order`, `createdAt` |
| `settings` | `id` | Singleton record `app-settings` |

Shared types define QR content, form metadata, category references, styles, favorites, and dates. Database initialization seeds categories and settings transactionally and offers retry feedback if storage cannot be opened. Reactive hooks read tables through Dexie; write helpers validate records and surface storage failures.

Backup version 1 contains QR codes and categories. Version 2 also contains settings. Dates serialize as ISO strings and are validated on restore. Import validates the complete payload before a transaction, adds missing categories, replaces QR codes sharing IDs, restores version 2 settings, and preserves unrelated records. Failed transactions roll back all writes.

Both export and import enforce a 10 MiB UTF-8 JSON limit; the merged library is limited to 10,000 QR codes and 1,000 categories. Export produces a complete restorable file or an error. Local writes use the same record constraints, including 512-character QR titles and 256-character category names. Imported remote logo URLs are rejected.

IndexedDB and backups are readable, unencrypted data. There is no automatic cross-browser or cross-device synchronization.

## PWA and network behavior

`vite-plugin-pwa` generates the production service worker with prompt-based updates. Assets, fonts, and legal notices are precached. Offline operation requires an initial online load and an activated worker controlling the page. Development does not enable this production worker.

The manifest and router assume deployment at the origin root. Host requests load assets and check updates. Deliberate link, map, search, share, and system-app actions can disclose selected QR content. Camera capabilities and installation offers depend on the browser and device.

## Validation

`npm test` builds, lints, and runs Vitest with Testing Library, happy-dom, and fake-indexeddb. Regressions cover encoding/parsing, validation, atomic backups, storage initialization, modal focus, scanner cleanup, installation offers, update prompts, and responsive layout. Browser and device acceptance procedures are in [PUBLICATION.md](PUBLICATION.md).
