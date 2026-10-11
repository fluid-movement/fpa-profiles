- 2026-10-11T09:13:43Z edited by claude-code/opus-5.5: requirement

- 2026-10-11T09:33:17Z claude-code/opus-5.5: Verified end to end with headless Chrome against the dev server and fpa-api on localhost: login (wrong and right password), search, edit, save, reload, sign-out, no browser errors; export reflects the save. Container built and smoke-tested: migrations on start, /healthz, /export, users script inside the container. FPA_API_REFRESH_TOKEN path not exercised locally (fpa-api has no token set).
