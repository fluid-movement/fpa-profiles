- 2026-10-11T12:11:17Z edited by claude-code/opus-5.5: parent, tags

- 2026-10-11T12:15:57Z claude-code/opus-5.5: Checked the database first: no saved profile had an empty link (normalizeFields drops blank rows), so the spare row was only visual. Browser-tested: 2 saved links render as 2 rows, Add link adds one, deleting the first saved link and saving stores the remaining two in order. Needed the form schema to accept empty array slots left by deleted rows. Tested profile restored from a backup of that one row afterwards.
