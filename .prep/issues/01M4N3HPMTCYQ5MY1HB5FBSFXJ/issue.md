---
title: Decide the shape of player profile data and its export
kind: decision
parent: 01M4N3HPHYB8PHJF2CSWT6A1HD
tags:
  - profiles
---

Decide which profile fields exist, their types, how a profile is keyed to an upstream player, which fields are public, and the JSON export format that fpa-api consumes. The legacy `wp_profiles` fields (see fpa-api 01M4N2FFB70GV9SE7V23AVT651) are the starting point, not the limit. Adding a field later must be cheap.

## Open questions
