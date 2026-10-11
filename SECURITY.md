# Security policy

## Supported versions

QRFolio is an initial preview. Security fixes target the current `main` branch and latest published preview; older releases are not maintained separately.

## Report a vulnerability privately

Open the repository's **Security → Advisories → Report a vulnerability** flow on GitHub. Include reproducible steps, affected version or commit, impact, and a minimal example using invented data.

Do not disclose vulnerabilities in public issues or attach real Wi-Fi passwords, contact information, populated backups, or credentials. If private reporting is unavailable on a fork, contact that fork's maintainer through a private channel before sharing details. Response times depend on maintainer availability.

## Data boundaries

The library is stored in browser IndexedDB without encryption. JSON backups and exported QR images can expose their contents. External actions may send selected data to third-party websites or system applications. Browser storage clearing or eviction can remove the local library; keep backups.

Camera access requires permission and a supported secure context. QR actions are validated, and scanned links require confirmation, but users should still review destinations before opening them. See [README.md](README.md) for supported workflows and limitations.
