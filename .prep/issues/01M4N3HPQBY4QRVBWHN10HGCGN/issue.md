---
title: Build the player profile editor
kind: code
parent: 01M4N3HPHYB8PHJF2CSWT6A1HD
depends_on:
  - 01M4N3HPMTCYQ5MY1HB5FBSFXJ
tags:
  - profiles
---

An authenticated UI to find an existing player (from fpa-api's player directory) and edit their profile, with the form generated from the field registry (decision 01M4N3HPMTCYQ5MY1HB5FBSFXJ). No player creation. Login through Better Auth with email and password; public sign-up is closed and the app sends no email. Editors are created and updated from the terminal (over SSH in production). The app replaces the scaffold's demo routes and placeholder table, deploys on Coolify (Node adapter, Dockerfile), and serves the read-only `GET /export` that fpa-api pulls. After a save it asks fpa-api to refresh.

## Open questions
