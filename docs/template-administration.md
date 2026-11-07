# Template Administration

Template upload access uses `public.template_admins`, not Supabase JWT role or user metadata.
Migration `0005_template_admin_authorization.sql` enables RLS, permits users to read only their
own allowlist entry, and permits writes to `presentation-templates` only for allowlisted users.

## Bootstrap an admin

1. Apply all Supabase migrations, including `0005_template_admin_authorization.sql`.
2. Create or identify the admin's Supabase Auth user UUID in the Supabase Dashboard.
3. In the Supabase SQL Editor, run:

```sql
insert into public.template_admins (user_id)
values ('AUTH_USER_UUID')
on conflict (user_id) do nothing;
```

4. Sign in as that user and open `/app/admin/templates`.
5. Upload a new, unique version such as `v2` or `v1.1`. Existing template paths are immutable.

The bootstrap SQL must run through a database administrator context such as the Supabase SQL
Editor. It cannot be run by the browser session because no client insert/update/delete policy
exists for this table.

## Presentation themes

Clicking "Gerar PowerPoint" opens a picker with one card per theme. Themes are colour and
typography variations of the approved master; the catalog lives in `lib/pptx/themes.ts`
(`base`, `navy-corporate`, `light-minimal`, `graphite-emerald`, `warm-terracotta`).

| Theme | Storage path | Source file |
| --- | --- | --- |
| `base` | `status-weekly/<version>/template.pptx` | `design/template-variations/template-base.pptx` |
| any other | `status-weekly/<version>/themes/<theme>.pptx` | `design/template-variations/<theme>.pptx` |

- The picker lists only themes published for the configured version (`PPTX_TEMPLATE_VERSION`);
  `base` is always offered. A theme missing from Storage is simply not shown.
- Upload each theme at `/app/admin/templates`, choosing the version and the theme. Paths stay
  immutable (`upsert: false`), so a changed theme needs a new version.
- The chosen theme is saved on the report (`weekly_reports.template_theme`) as the next default and
  on every generated presentation (`generated_presentations.template_theme`), so rebuilding an
  expired file from its snapshot always uses the theme it was generated with.
- "Visualizar com este tema" in the picker opens `/app/reports/<id>/preview?theme=<theme>`, which
  renders the same generator in memory without saving a version.
- Migration `0013_presentation_template_themes.sql` adds both columns, the extra
  `target_template_theme` argument of `finalize_generated_presentation`, and widens the
  `presentation-templates` storage policies to `themes/<theme>.pptx`.
- Picker thumbnails are `public/template-themes/<theme>.png`, built from the preview overviews by
  `scripts/design/build-theme-thumbnails.ps1`.

## Remove access

```sql
delete from public.template_admins
where user_id = 'AUTH_USER_UUID';
```

No `SUPABASE_SERVICE_ROLE_KEY` or other secret belongs in browser code or application environment
variables for this flow. The route uses the authenticated user's server-side Supabase session and
RLS for a second authorization check.
