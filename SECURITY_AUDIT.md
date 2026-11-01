# Security Audit — Supabase / SQL execution review

**Date:** 2026-10-23  
**Scope:** Clites static website, its Supabase browser integration, environment/config files, migration, and local preview server.  
**Review type:** Source review + local read-only tests + one read-only Supabase REST request using the public publishable key.

> No secret values are reproduced in this document. The audit did not use the service-role credential and did not run destructive SQL or insert production data.

## Executive summary

The website does **not** contain a Supabase service-role/secret key, does not have a public SQL execution endpoint, and does not expose pg-meta functionality. The frontend uses only the publishable key and sends parameterized object payloads through the Supabase client.

Two security-relevant issues were found outside the normal application path:

1. A Supabase **service-role key was shared in the conversation** earlier. It was not found in the repository and was not used by the site or by this audit. Treat it as exposed and rotate it.
2. A secret-bearing `.env` file was present in the web root and was served by the local static preview server. It contained only the publishable key, so no secret was disclosed, but the file location was unsafe. It has been moved outside the web root, and the generator/docs were hardened.

The live `project_inquiries` table is **not yet created** in Supabase. The migration exists in the repository, but the live database returned `PGRST205` (“table not found”), so RLS and insert/read/update/delete behavior could not be verified against the live project.

## Findings

| ID | Severity | Finding | Status |
|---|---|---|---|
| F-01 | **High** | Supabase service-role key was exposed in the conversation, not in the repository | Confirmed external exposure; rotate |
| F-02 | **Medium (latent)** | `.env` was served from the web root by the local static server | Confirmed misconfiguration; fixed; no secret was in it |
| F-03 | **Medium (operational)** | Migration not applied; live RLS and inquiry permissions unverified | Confirmed deployment gap |
| F-04 | Low (hardening) | Generator/frontend rejected new secret keys but not legacy service-role JWTs | Latent gap; fixed |
| F-05 | Low / informational | Local preview server also serves non-secret source files | Remaining risk; documented |
| F-06 | Low / remaining risk | No CAPTCHA/rate limiting on public inserts | Not a code vulnerability |
| F-07 | **False positive** | Public arbitrary SQL execution / pg-meta endpoint | Not present |
| F-08 | **False positive** | Service-role key in frontend bundle or VITE variable | Not present |

---

### F-01 — Service-role key exposed in conversation

**Severity:** High  
**Affected file/line:** None in the repository; the credential was pasted into the chat conversation earlier.  
**Evidence:** A credential of type Supabase service-role/secret key was shared in the conversation. A redacted project scan found zero `sb_secret_` values, zero JWT-like tokens, and zero non-empty `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_SECRET_KEY` assignments in project files. The site code never reads a service-role key.  
**Fix applied:** No code change can revoke a credential that was exposed outside the repository. The credential must be rotated in the Supabase dashboard. It was not used by this audit and must not be placed in the browser config, `VITE_*` variables, or the web root.  
**Confirmed or false positive:** Confirmed exposure event; not a repository/frontend finding.

---

### F-02 — `.env` was served by the local static preview server

**Severity:** Medium (latent secret-handling issue; actual content was public-only)  
**Affected file/line:** `.env` at the project root, lines 1–2 (before fix); `README.md:45` (old preview command).  
**Evidence:** Before the fix, `GET http://localhost:8080/.env` returned HTTP `200`. A redacted inspection showed only `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`; there was no service-role/secret key in the file. After the fix, `/.env` returns `404`, and the env file is stored outside the project web root with mode `0600`.  
**Fix applied:**
- Moved the real env file outside the web root.
- Added `ENV_FILE` support in `scripts/generate-supabase-config.mjs:15-19`.
- The generator now refuses an env file inside the web root if it contains a service-role key or a new secret key (`scripts/generate-supabase-config.mjs:99-106`).
- Updated `.env.example:5-9`, `README.md:49`, and `supabase/README.md:45,62` with the static-server warning and outside-root workflow.
- Confirmed traversal attempts to the outside env file return `404`.
**Confirmed or false positive:** Confirmed misconfiguration. No secret value was disclosed because the file contained only the publishable key.

---

### F-03 — Live migration not applied; RLS unverified

**Severity:** Medium (operational/deployment gap; not a confirmed code vulnerability)  
**Affected file/line:** `supabase/migrations/20261023193000_create_project_inquiries.sql:12-112`; status documented at `README.md:76`.  
**Evidence:** A read-only `GET /rest/v1/project_inquiries?select=id&limit=1` using the publishable key returned HTTP `404` with `PGRST205` (“Could not find the table `public.project_inquiries` in the schema cache”). Therefore:
- The table does not exist in the live project.
- RLS policies are not active in the live project.
- A real successful insert, anonymous read denial, and update/delete denial could not be verified.

Static review of the migration is positive:
- RLS is enabled and forced (`migration:81-82`).
- `anon`/`authenticated` have insert privileges only on the six public form columns (`migration:87-90`).
- No public `SELECT`, `UPDATE`, or `DELETE` policy is created (`migration:110-112`).
- A `BEFORE INSERT` trigger forces `status = 'pending'` and `created_at = now()` (`migration:54-79`).
- The insert policy repeats length/email/status validation (`migration:95-108`).

**Fix applied:** No schema change was made during this audit. Apply the existing migration, then run the verification commands in `supabase/README.md`. Do not claim the backend is fully tested until then.  
**Confirmed or false positive:** Confirmed deployment gap; not proof of a vulnerability.

---

### F-04 — Legacy service-role JWT guard hardening

**Severity:** Low (latent hardening gap)  
**Affected file/line:** `scripts/generate-supabase-config.mjs:78-97`; `js/project-inquiry.js:426-455`.  
**Evidence:** The original guard rejected `sb_secret_` keys but did not inspect legacy JWT payloads. A legacy service-role JWT could therefore have been written to the public browser config if someone supplied it as the publishable key. No such key was found in the project.  
**Fix applied:** Both the generator and browser validation now decode the JWT payload and reject `role: service_role` and `role: supabase_admin`. A fake test JWT with `role: service_role` was rejected by the generator and by the browser; no Supabase request was made.  
**Confirmed or false positive:** Latent gap, not a confirmed credential exposure. Hardened.

---

### F-05 — Local preview server exposes non-secret source files

**Severity:** Low / informational  
**Affected file/line:** `README.md:45` (`python3 -m http.server 8080`).  
**Evidence:** The local preview server returns `200` for non-secret files such as `.gitignore`, `supabase/migrations/20261023193000_create_project_inquiries.sql`, and `scripts/generate-supabase-config.mjs`. These files contain no credentials, but they reveal internal structure and schema details.  
**Fix applied:** The dangerous secret-bearing `.env` file was removed from the web root. `README.md:49` now warns that the preview server can serve dotfiles/source files and that production must block them.  
**Remaining action:** Use a production static host or web server that denies dotfiles and source paths. Do not place secrets in the web root.

---

### F-06 — Public form spam / rate limiting

**Severity:** Low / remaining risk  
**Affected file/line:** `supabase/migrations/20261023193000_create_project_inquiries.sql:95-108`; public form flow.  
**Evidence:** Anonymous visitors can insert valid inquiries. There is no CAPTCHA or application-level rate limit. Supabase platform limits are not a complete anti-abuse control.  
**Fix applied:** None in this audit; adding a CAPTCHA/rate-limit requires a product/architecture decision and possibly an Edge Function. Do not add a public read/delete policy to compensate.  
**Confirmed or false positive:** Not a code vulnerability; operational abuse risk.

---

### F-07 — Arbitrary SQL execution / pg-meta endpoint

**Severity:** N/A  
**Affected file/line:** None.  
**Evidence:**
- No server routes or API directory exist in the project.
- Searches found no `pg-meta`, `/query` handler, `exec_sql`, `rpc`, or raw SQL execution code.
- Local probes: `GET /pg-meta/`, `/pg-meta/query`, `/query`, `/api/query`, `/exec_sql` returned `404`; `POST` to those paths returned `501` from the static server.
- The only database call in the browser is `client.from('project_inquiries').insert(payload)` (`js/project-inquiry.js:313`), which uses PostgREST’s parameterized insert, not user-controlled SQL.
**Confirmed or false positive:** False positive. No SQL execution endpoint exists.

---

### F-08 — Service-role key in frontend / VITE variables

**Severity:** N/A  
**Affected file/line:** `js/project-inquiry.js:378` (publishable key only); `supabase-config.json` (only `url` and `publishableKey`); `.env.example:11-18` (placeholders/public aliases); `.gitignore:2-5`.  
**Evidence:**
- Redacted project scan found no `sb_secret_` values, no JWT-like tokens, no non-empty secret/service-role assignments, and no `VITE_*SERVICE*`/`VITE_*SECRET*` names.
- Served-file scan found no secret/JWT patterns in the HTML, CSS, JS, vendor client, or config.
- `supabase-config.json` contains only the project URL and a key classified as `sb_publishable_`.
- No build output, `dist`, `build`, `.next`, or `.vite` directory exists; there is no Git repository.
- The `service_role` strings in `js/project-inquiry.js:452-454` and `scripts/generate-supabase-config.mjs:90-105` are guards/documentation, not credentials.
**Confirmed or false positive:** False positive. The publishable key is intentionally public. The only service-role exposure is the chat exposure in F-01.

---

## Files changed during this audit

- Removed the real `.env` from the web root and moved it outside the project (not a repository file).
- `scripts/generate-supabase-config.mjs` — `ENV_FILE` support, web-root secret refusal, new-secret/legacy-JWT rejection.
- `js/project-inquiry.js` — browser-side rejection of privileged legacy JWTs; still publishable-key-only.
- `.env.example` — outside-web-root warning and server-only secret placeholders.
- `README.md` and `supabase/README.md` — corrected config workflow and static-server warning.
- `SECURITY_AUDIT.md` — this report.
- No website design changes and no database schema changes were made during this audit.

## Tests performed

All tests were local/read-only except one read-only Supabase REST request using the publishable key. No service-role credential was used. No production data was inserted, changed, or deleted.

| Test | Result |
|---|---|
| Redacted scan for `sb_secret_`, JWT-like tokens, service/secret env assignments | 0 secret values found in project files |
| Scan for `VITE_*SERVICE*` / `VITE_*SECRET*` | 0 matches |
| Config classification | Only `url` + publishable key |
| Served JS/HTML/CSS/config scan for secret/JWT patterns | No secret/JWT patterns |
| `GET /.env` before fix | `200` (misconfiguration; only publishable key inside) |
| `GET /.env` after fix | `404` |
| Path traversal to outside env | `404` for three tested variants |
| Generator with env file inside web root + dummy service-role key | Refused (exit `1`) |
| Generator with env file inside web root + dummy `SUPABASE_SECRET_KEY` | Refused (exit `1`) |
| Generator with fake legacy service-role JWT | Refused (exit `1`) |
| Browser with fake service-role JWT | Backend unavailable; no Supabase request; honest error |
| Local `GET /pg-meta/`, `/query`, `/api/query`, `/exec_sql` | `404` |
| Local `POST /query`, `/pg-meta/query` | `501` (static server; no handler) |
| Live public REST read with publishable key | `404 PGRST205` — table missing; RLS not live |
| Browser form open on index/service/portfolio | Passed |
| Browser empty/invalid field validation | Passed; no insert request |
| Browser valid submission with missing table | Honest error; no success message |
| Browser mobile 390×844 layout | No horizontal overflow; modal scrolls to submit |
| `node --check` on frontend/generator JS | Passed |
| Git history / build output review | No Git repository; no build output directories |

## Remaining risks

1. **Rotate the service-role key** that was shared in the conversation. Do not use it for testing.
2. **Apply the migration** and verify the RLS behavior and a real insert in the live Supabase project.
3. **Audit other live tables** if the Supabase project contains tables not represented in this repository. This audit only covers `project_inquiries`.
4. **Block dotfiles/source paths** on the production static host. The local Python preview server is not a production server.
5. **Add abuse protection** (CAPTCHA/rate limiting) if the public form receives spam.
6. Keep `supabase-config.json` generated per deployment. It is intentionally public, but it is gitignored; a missing file means the form shows a configuration error.
7. There is still no admin dashboard. Administrators should use the Supabase Dashboard, and any future admin UI must add server-side authorization and RLS policies. Treat inquiry text as untrusted and escape it when rendering it in a future admin UI.
8. This workspace has no Git repository, so the migration is not yet version-controlled. Initialize Git and commit the migration and config workflow before deploying.

## Beginner-friendly answers

### 1. Was there an actual vulnerability?

There was **no service-role/secret key in the website code or repository**, and there was **no public SQL execution endpoint**. The website uses only the public “publishable” key.

However, two things were real security concerns:

- A Supabase **service-role key was shared in the chat**. That is a powerful secret and must be rotated.
- A `.env` file was sitting in the website folder while a local file server was running. The file only contained the public publishable key, so no secret leaked, but it was in the wrong place. It has been moved out.

The live database migration also has not been applied yet, so the database protections are not active there.

### 2. What did you fix?

- Moved the real env file outside the website folder.
- Updated the config generator and documentation so secrets are not kept in the web root.
- Made the generator refuse a service-role key inside the web root.
- Added a check that rejects both new secret keys and legacy service-role JWTs.
- Kept the frontend on the publishable key only.
- Did not change the website design, database schema, or unrelated functionality.

### 3. Do I need to rotate any Supabase keys?

**Yes — rotate the service-role key** that was pasted into the conversation. Treat it as compromised even if it was never used by the site.

You do **not** need to rotate the publishable key just because it appears in `supabase-config.json`; publishable keys are designed to be public. If you are unsure which key is which, rotate the one beginning with `sb_secret_` or the legacy JWT with a `service_role` role.

### 4. Does the backend still work?

The frontend still loads, the inquiry dialog opens on all three pages, validation works, and failures are reported honestly. The live insert is **not yet verified** because the `project_inquiries` table does not exist in the Supabase project. After applying the migration, test one real submission and verify that public reads/updates/deletes are denied.

### 5. What should I do next?

1. Rotate the exposed service-role key in Supabase.
2. Apply `supabase/migrations/20261023193000_create_project_inquiries.sql`.
3. Run the verification commands in `supabase/README.md`.
4. Submit one test inquiry and confirm it appears in the Supabase Table Editor.
5. Try to read/update/delete it with the publishable key and confirm those requests are denied.
6. Use a production static host that blocks `.env`, `.git`, and source/migration paths.
7. Consider CAPTCHA or rate limiting for the public form.

This audit does not claim the website or the entire Supabase project is fully secure. It covers the files and behavior available in this repository.
