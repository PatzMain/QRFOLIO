# Contributing

Bug reports, documentation improvements, and focused pull requests are welcome. For a large feature or behavior change, open an issue first to discuss the intended outcome.

## Set up

Use Node.js 24.x and npm 12.x. Fork and clone the repository, then run `npm ci` and `npm run dev`. See [README.md](README.md) for HTTPS and production-preview details.

## Before opening a pull request

```sh
npm test
npm run notices:check
npm audit --audit-level=moderate
```

Describe the problem, resulting behavior, and checks you ran. Include screenshots for visible changes. Use invented QR content and network credentials in tests, screenshots, and issue attachments.

Follow the existing feature-based layout and TypeScript conventions. Add focused regressions for changed behavior, especially persistence, QR parsing, external actions, and camera cleanup. Update setup or behavior documentation when relevant. Preserve existing backup compatibility unless a migration is explicitly designed and tested.

## Dependencies and assets

Commit `package-lock.json` with dependency changes. The notice verifier intentionally rejects a changed lockfile until the distribution inventory has been reviewed. Compare locked versions and browser/service-worker dependencies, retain complete upstream license and embedded notice text, update the inventory and hashes, then rerun verification. Do not simply replace hashes to silence a failure.

Only contribute assets and source you have permission to redistribute. Record required attribution in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The application MIT license does not replace upstream terms. Contributions are submitted under the project's MIT license, with third-party material retaining its own terms.

## Reporting problems

Use the bug template for ordinary failures and the feature template for proposals. Include browser, operating system, reproducible steps, and expected behavior. Remove personal QR content, passwords, and backup data from attachments.

For suspected security vulnerabilities, use [private vulnerability reporting](SECURITY.md). Please keep interactions respectful and focused on the project.
