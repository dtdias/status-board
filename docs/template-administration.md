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

## Remove access

```sql
delete from public.template_admins
where user_id = 'AUTH_USER_UUID';
```

No `SUPABASE_SERVICE_ROLE_KEY` or other secret belongs in browser code or application environment
variables for this flow. The route uses the authenticated user's server-side Supabase session and
RLS for a second authorization check.
