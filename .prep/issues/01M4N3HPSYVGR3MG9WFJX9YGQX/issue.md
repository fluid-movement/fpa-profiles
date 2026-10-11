---
title: Import legacy profiles from the WordPress dump
kind: code
parent: 01M4N3HPHYB8PHJF2CSWT6A1HD
depends_on:
  - 01M4N3HPMTCYQ5MY1HB5FBSFXJ
tags:
  - profiles
---

A one-off script reads the local WordPress dump (never committed) and writes profiles into the database, matching each legacy player to a canonical upstream player. Legacy ids sit on alias records for 127 of 227 players, so matching resolves `fpaWebsiteId` through the upstream alias chain (all 227 then map to exactly one canonical player). Plaintext passwords and emails are never read into the new store. The script is run once and kept out of the committed migrations.

## Open questions

- Which of the 16 duplicate legacy profiles wins (assumption: the higher `profile_id`)?
