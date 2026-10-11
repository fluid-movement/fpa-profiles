---
title: Build the player profile editor
kind: code
parent: 01M4N3HPHYB8PHJF2CSWT6A1HD
depends_on:
  - 01M4N3HPMTCYQ5MY1HB5FBSFXJ
tags:
  - profiles
---

An authenticated UI to find an existing player (from fpa-api's player directory) and edit their profile. No player creation. Login through Better Auth for a single editor; public sign-up is closed. The app replaces the scaffold's demo routes and placeholder table, deploys on Coolify (Node adapter, Dockerfile), and serves the read-only JSON export fpa-api pulls. After a save it asks fpa-api to refresh.

## Open questions

- How is the first editor account created: a seed script, or a one-time invite?
