# Supabase backend — project inquiries

The Clites site is a static HTML/CSS/JS site. There is no Vite app, package manager, Express server, or existing admin dashboard. The project inquiry dialog is the only backend-connected feature.

## Architecture

- **Database:** Supabase Postgres table `public.project_inquiries`.
- **Browser access:** the Supabase JavaScript client using the **publishable** key.
- **Security:** Row Level Security plus column-level grants. Anonymous and authenticated browser roles can only `INSERT` the six public form columns.
- **Server-only access:** no Edge Function or admin dashboard exists yet. Use the Supabase Dashboard (or a future server-side endpoint with the service-role key) to review and update inquiries.
- **Storage:** not used; the site has no file-upload feature.
- **Auth:** not configured; there is no admin UI to protect.

## One-time database setup

1. Open the Supabase project dashboard → **SQL Editor**.
2. Paste and run the migration in [`migrations/20261023193000_create_project_inquiries.sql`](migrations/20261023193000_create_project_inquiries.sql).
3. Confirm the table exists and RLS is enabled:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'project_inquiries';

select polname, polcmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'project_inquiries';
```

Expected: `rowsecurity = true`, one `INSERT` policy for `anon`/`authenticated`, and no public `SELECT`/`UPDATE`/`DELETE` policy.

If you use the Supabase CLI instead, link the project and push the migration:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The CLI needs its own access token and database credentials; the browser publishable key is not sufficient.

## Browser configuration

The site cannot read Vite environment variables at runtime because it has no build step. Instead, a small generator creates the browser-safe JSON config. Keep the env file **outside the web root** so a static preview server cannot serve it.

```bash
cp .env.example ../clites.env
# Fill in the project URL and publishable key in ../clites.env
ENV_FILE=../clites.env node scripts/generate-supabase-config.mjs
```

This writes `supabase-config.json` containing only:

```json
{
  "url": "https://YOUR_PROJECT_REF.supabase.co",
  "publishableKey": "sb_publishable_YOUR_KEY"
}
```

`supabase-config.json` is ignored by `.gitignore` and is generated per deployment. The service-role key is never written to the browser config. Keep the source env file outside the web root: the local preview server can serve dotfiles and source files.

If you later migrate the site to Vite, the generator also accepts the aliases `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Security model

- `anon` and `authenticated` have **no** `SELECT`, `UPDATE`, or `DELETE` privilege on the table.
- They have `INSERT` only on `name`, `email`, `business_name`, `project_type`, `budget`, and `message`.
- The `BEFORE INSERT` trigger trims input and forces `status = 'pending'` and `created_at = now()`.
- The insert policy repeats the validation rules and requires `status = 'pending'`.
- `id`, `status`, and `created_at` cannot be supplied by browser clients.
- Do **not** add public read/update policies to this table. Administrators should use the Supabase Dashboard or a server-side admin endpoint.
- The service-role key bypasses RLS. Keep it out of the frontend, out of `VITE_*` variables, and out of source control. If it has been shared in chat or a ticket, rotate it in Supabase.

## Verification commands

Use a shell with the project URL and **publishable** key exported. Do not use the service-role key here.

```bash
export SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
export SUPABASE_PUBLISHABLE_KEY="sb_publishable_YOUR_KEY"
```

Public read must be denied (after the migration is applied):

```bash
curl -i "$SUPABASE_URL/rest/v1/project_inquiries?select=*" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY"
```

Public update/delete must also be denied:

```bash
curl -i -X PATCH "$SUPABASE_URL/rest/v1/project_inquiries?id=eq.00000000-0000-0000-0000-000000000000" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status":"closed"}'

curl -i -X DELETE "$SUPABASE_URL/rest/v1/project_inquiries?id=eq.00000000-0000-0000-0000-000000000000" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY"
```

A valid public insert should return `201` with no response body:

```bash
curl -i -X POST "$SUPABASE_URL/rest/v1/project_inquiries" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "business_name": "Test Co",
    "project_type": "Website design & development",
    "budget": "Not sure yet",
    "message": "This is a migration verification message."
  }'
```

Then delete the test row from the Supabase Dashboard. Do not expose a public delete policy just to clean it up.

Invalid inserts (missing required fields, bad email, short message, or an attempted `status`/`created_at` override) must be rejected.

## Admin workflow

There is currently no admin dashboard in this repository, so none was invented. Review inquiries in **Supabase Dashboard → Table Editor → project_inquiries**, and update `status` there.

If an admin UI is added later:

1. Create the administrator in Supabase Auth.
2. Put an admin role in server-controlled `app_metadata` (not user-editable `user_metadata`).
3. Add RLS policies for `select`/`update` restricted to that role, plus the necessary grants.
4. Keep server-side authorization checks and never rely on frontend route guards alone.
5. Do not expose the service-role key to the browser.

## Remaining production tasks

- Apply the migration to the live Supabase project and run the verification commands above.
- Test one real form submission after the table exists.
- Add CAPTCHA/rate limiting if the public form receives spam. Supabase's built-in limits help, but they are not a substitute for abuse monitoring.
- Rotate any service-role key that has been shared outside a secure server environment.
