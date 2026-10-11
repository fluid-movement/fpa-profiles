- 2026-10-11T13:51:40Z edited by claude-code/opus-5.5: requirement

- 2026-10-11T13:56:16Z claude-code/opus-5.5: Verified against local Postgres with a throwaway vitest spec calling the real saveProfile/getProfile: a profile with a value is stored, saving it empty deletes the row, saving empty again writes nothing. Spec removed; local profile count unchanged (226).
