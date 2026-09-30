# End-to-end tests

`npm run test:e2e` runs Playwright tests in `tests/e2e`. It does not start the
Next.js server and does not run by default as part of unit tests, linting,
typechecking, or builds.

The suite is skipped unless all of these variables are set in the command
environment or `.env.local`:

```text
E2E_RUN=true
E2E_BASE_URL=http://127.0.0.1:3000
E2E_USER_EMAIL=e2e-user@example.test
E2E_USER_PASSWORD=replace-with-a-test-only-password
```

Install Chromium once before running against a configured environment:

```text
npx playwright install chromium
```

Use an isolated Supabase project and a dedicated E2E user. It must have a
`profiles` row because the application blocks report creation until profile
setup is complete. Apply all migrations, configure the application with that
project's Supabase variables, and upload the required template to private
Storage at `presentation-templates/status-weekly/v1/template.pptx`.

The current suite verifies login, creating a week, creating a delivery and a
resolved incident, then validation. It correctly expects validation to fail:
`weekly_reports.highlight` is required by the PRD but the application has no
report-edit UI or authenticated endpoint to set it. The generate/history case
is intentionally marked `fixme` until that gap is implemented. It must then
exercise `POST /api/reports/:id/validate`, `POST /api/reports/:id/generate-pptx`,
and `GET /api/reports/:id/presentations` against the real template.

Do not treat skipped or `fixme` tests as integration coverage.
