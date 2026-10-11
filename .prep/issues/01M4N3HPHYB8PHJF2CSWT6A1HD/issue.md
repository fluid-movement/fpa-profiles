---
title: Player profile enrichment
kind: manual
tags:
  - profiles
---

Enrich the players that fpa-api serves from upstream with profile data (bio, nickname, hometown, career highlights, partners, mentors, sponsors and similar) that the old FPA WordPress site had and the new data source lacks. One authenticated editor (possibly more later) edits existing players' profiles here; players are never created. A one-off import seeds the profiles from the legacy dump. fpa-api pulls the profiles through a read-only JSON export and serves them publicly. The fpa-api side is tracked in fpa-api's parent issue 01M4N2FF7A80SQHMF2QAMFNKSJ, which also holds the dump analysis (01M4N2FFB70GV9SE7V23AVT651) and the stack decision (01M4N2FFHKBV8MB99QJ3NQJ5EZ).

## Open questions
