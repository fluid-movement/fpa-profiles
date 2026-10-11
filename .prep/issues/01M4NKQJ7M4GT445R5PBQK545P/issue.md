---
title: Remove the one-off legacy import
kind: code
parent: 01M4N3HPHYB8PHJF2CSWT6A1HD
tags:
  - profiles
---

The legacy WordPress profiles were imported into production on 2026-10-11, and the import will never run again. Remove it: the script `scripts/import-legacy.ts`, its mapping in `src/lib/legacy/` with its tests, the `import:legacy` package script, the files the Dockerfile copies only for it, and its documentation. The `legacy_id` column stays: it records where each imported profile came from.

## Open questions
