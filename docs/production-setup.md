# Production Setup

## Runtime and build

- Deploy to Vercel with Node.js 22.x. `package.json` requires Node `>=22`.
- Use npm 10 with the committed lockfile. CI uses `npm ci`, then `npm run lint`,
  `npm run typecheck`, `npm test`, and `npm run build`.
- Vercel may use its normal Next.js build command: `npm run build`.
- Do not move PPTX generation to Edge. `POST /api/reports/:reportId/generate-pptx`
  is explicitly `runtime = "nodejs"` with `maxDuration = 60` and uses Buffers.

## Environment

Set these Vercel variables for every deployed environment:

```text
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<Supabase publishable key>
APP_URL=https://<production-domain>
PPTX_TEMPLATE_VERSION=v1
```

The first three are server-only runtime variables. `PPTX_TEMPLATE_VERSION` is optional and
defaults to `v1`; it selects `status-weekly/<version>/template.pptx`.

`.env.example` also defines test-only variables. Do not set them in production
unless deliberately running the isolated Playwright suite:

```text
E2E_RUN
E2E_BASE_URL
E2E_USER_EMAIL
E2E_USER_PASSWORD
```

No browser client imports Supabase, so no Supabase variable needs the `NEXT_PUBLIC_`
prefix. The publishable key remains constrained by RLS; this naming change is not a
replacement for database policies. `SUPABASE_SERVICE_ROLE_KEY` must exist only in the
deployed `delete-account` Edge Function secrets, never in Vercel or browser variables.

## Supabase

1. Create the production Supabase project and enable the intended Auth users.
2. Apply migrations in repository order: `0001_initial_schema.sql` through
   `0008_signup_confirmation_resend_cooldown.sql`.
3. The standard Supabase CLI command for applying local migrations to a linked
   project is `supabase db push`. Alternatively, apply the eight SQL files in
   order through the Supabase SQL Editor. Do not reorder or omit a migration.
4. Confirm the migrations created private buckets `generated-presentations` and
   `presentation-templates`. They must remain private.
5. Upload the supplied `Template(1).pptx` as
   `presentation-templates/status-weekly/v1/template.pptx`. The object must use
   the PPTX MIME type and be no larger than 25 MiB. Its version must match
   `PPTX_TEMPLATE_VERSION`.
6. Create an Auth user for the template administrator, then bootstrap access as
   a database administrator:

```sql
insert into public.template_admins (user_id)
values ('AUTH_USER_UUID')
on conflict (user_id) do nothing;
```

The allowlist is required for `/app/admin/templates`; ordinary authenticated
users cannot upload templates. See [template administration](template-administration.md)
for removal and versioning rules. Generated PPTX objects are created by the app
under `<user-id>/<report-id>/v<version>.pptx`; do not pre-create them.

## Auth and account deletion

1. Enable email confirmation in Supabase Auth.
2. Set the Site URL to `APP_URL` and allow `${APP_URL}/auth/callback` as a redirect URL.
3. Configure the confirmation email template link to use `{{ .ConfirmationURL }}`.
   Do not build a link manually with `{{ .SiteURL }}` or a root `?code=...` URL.
4. Deploy `supabase/functions/delete-account/index.ts` with JWT verification enabled.
5. Add `SUPABASE_SERVICE_ROLE_KEY` only to the Edge Function secret store. Never add it to
   `.env.local`, Vercel, client code, or request bodies.
6. Validate signup, duplicate e-mail attempts, confirmation, reauthentication, Storage
   cleanup, database cascade, and final session invalidation in an isolated project.
7. Copy `docs/email-templates/supabase-confirmation.html` into the Supabase `Confirm signup`
   template and `docs/email-templates/supabase-invite.html` into `Invite user`.
8. Keep `{{ .ConfirmationURL }}` unchanged in both templates. It carries the one-time token
   and the allowlisted redirect URL.
9. Copy `docs/email-templates/supabase-recovery.html` into `Reset password` and
   `docs/email-templates/supabase-magic-link.html` into `Magic Link`.
10. Allow exact redirects for `/auth/callback?next=/app` and
    `/auth/callback?next=/reset-password`.

## Confirmation resend

The signup page exposes resend after a confirmation request. A database RPC atomically claims
a five-minute window per normalized e-mail hash. UI countdown is feedback; database cooldown
remains authoritative across browsers and app instances.

Magic Link uses `shouldCreateUser: false`, so it never creates an account. Confirmed accounts
can use password login or Magic Link; confirmed accounts do not receive signup confirmation
resends.

## Deploy Validation

1. Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, and
   `npm run build` using Node 22 and npm 10.
2. Deploy to Vercel with the three environment variables above. Verify the
   deployment's runtime log does not report `Missing Supabase environment variables.`
3. Sign in with a production Auth user, complete the profile, and create a
   report. This confirms the publishable-key client, cookies, database schema,
   and RLS work together.
4. Sign in as the bootstrapped template admin and confirm `/app/admin/templates`
   accepts a new unused version. Leave `v1` in place for the configured runtime.
5. Populate a report that passes validation, generate a PPTX, then download it
   from presentation history. Confirm a new row exists in `generated_presentations`
   and a private object exists in `generated-presentations` at its stored path.
6. Confirm the generated deck opens and retains the supplied template visual
   master. A missing configured template returns HTTP 503 from generation; fix
   the private Storage object rather than changing the route runtime.

Optional browser coverage requires a separate Supabase project, dedicated E2E
user, configured `v1` template, and the `E2E_*` values above. See [E2E setup](e2e.md).
