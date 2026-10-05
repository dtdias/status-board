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

Use an isolated Supabase project and a dedicated E2E user. The user must be
able to sign in and have a completed `profiles` row because the application
blocks report creation until profile setup is complete. Apply migrations
`0001_initial_schema.sql` through `0007_fix_report_content_editable_trigger.sql`
in order.
Configure the app served at `E2E_BASE_URL` with that project's Supabase
variables and a `PPTX_TEMPLATE_VERSION` that matches the uploaded template.

Upload the reviewed production-compatible template, not a generated fixture,
to private Storage at `presentation-templates/status-weekly/v1/template.pptx`
when using the default version. The authenticated E2E user needs only normal
application permissions; do not add a service-role key or relax RLS policies.
Each run creates a report and a private generated PPTX in this isolated
environment, so retain it for test data only.

The current suite signs in, creates a report, saves the required weekly
highlight through the details UI, creates a delivery and resolved incident,
validates through `POST /api/reports/:id/validate`, marks the report ready
through the UI, and generates through the UI. It then asserts the generated
presentation through `GET /api/reports/:id/presentations` and downloads the
real PPTX from its authenticated download route.

Do not treat skipped or `fixme` tests as integration coverage.

## GitHub Actions

The optional `Optional E2E` workflow runs on pushes, pull requests, and manual
dispatch only when the isolated E2E environment has all required repository
secrets. Its preflight job otherwise succeeds with a notice that names the
missing configuration, and the Playwright job is skipped. A skipped job is not
E2E coverage.

Configure these repository secrets before expecting the workflow to run:

```text
E2E_BASE_URL
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
E2E_USER_EMAIL
E2E_USER_PASSWORD
E2E_TEMPLATE_READY=true
```

`E2E_TEMPLATE_READY` is an explicit confirmation that the configured isolated
Supabase project has the required private Storage template at
`presentation-templates/status-weekly/v1/template.pptx`. Keep all values in
GitHub Actions secrets. The workflow never prints them, only configuration
names. It caches Playwright's Chromium download by `package-lock.json` and
still runs `npx playwright install --with-deps chromium` to ensure browser
dependencies are present.

## PWA checks

`tests/e2e/pwa.spec.ts` checks the public manifest, service worker, install
icons, offline fallback, and the absence of private URLs in Cache Storage.
`tests/e2e/mobile-report.spec.ts` uses a 390px touch viewport to verify all board
sections, native disclosure collapse, horizontal overflow, and reorder controls.
The PWA suite also verifies the custom Chromium install action and iOS guidance.
These checks require `E2E_RUN=true`
and a production-like origin in `E2E_BASE_URL`; PWA checks need a production
build because the service worker registers only there.
