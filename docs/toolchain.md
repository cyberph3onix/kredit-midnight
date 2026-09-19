# Toolchain — Kredit Protocol

**Single source of truth for all pinned versions.**

Last updated: 2026-09-19

## Supported Versions (Midnight Preprod Network)

| Component | Version | Source |
|---|---|---|
| Compact devtools | 0.5.2 | `compact --version` |
| Compact compiler | 0.31.1 | `compact update 0.31.1` |
| Compact language | 0.23.0 | `pragma language_version 0.23.0` |
| Compact JS | 2.5.1 | contract/package.json |
| Compact runtime | 0.16.0 | contract/package.json |
| Midnight.js | 4.1.1 | frontend/package.json |
| DApp Connector API | 4.0.1 | frontend/package.json |
| Proof server | 8.1.0 | Docker image tag |
| Node.js | 22+ | .github/workflows/ci.yml |

## Installation

```bash
# Install compact devtools
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh

# Pin compiler to network-supported version
compact update 0.31.1
```

## Verification

```bash
compact --version    # Should show 0.5.2 (devtools) with compiler 0.31.1
node --version       # Should show v22+
```
