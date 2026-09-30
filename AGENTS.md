# Agent Instructions

## Source Of Truth

- Read relevant `PRD.md` sections before changing behavior, architecture, or PPTX output.
- `app/` owns App Router pages, route handlers, and server actions; business logic belongs in `lib/`; Supabase migrations live in `supabase/migrations/`.
- `README.md` links to production and E2E runbooks; use `docs/production-setup.md`, `docs/e2e.md`, and `docs/template-administration.md` for operational details.
- For architecture, ownership, or cross-file relationship questions, check `graphify-out/graph.json` first and query Graphify before broad manual searches; build the graph with `/graphify` when absent. Do not commit generated `graphify-out/` artifacts unless requested.

## Commands

- Required verification order: `npm ci` with Node 22/npm 10, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- `npm run lint` intentionally scopes `app lib tests` and root configs; do not replace it with `eslint .`, which also lints unrelated `.opencode` scripts.
- Focus one unit file with `npm test -- tests/unit/<name>.test.ts`.
- `npm run test:e2e` is environment-gated and does not start Next.js. It skips unless `E2E_RUN=true`, `E2E_BASE_URL`, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD` exist; install Chromium with `npx playwright install chromium`.
- CI runs the same unit/build checks in `.github/workflows/verification.yml`; optional E2E requires isolated Supabase secrets and `E2E_TEMPLATE_READY=true`.

## Stage Workflow

- Before each implementation stage, ask which new branch to use; never start a stage directly on the current branch.
- Add unit tests with each stage; run focused tests plus lint/typecheck/build before commit.
- Commit incrementally; inspect status/diff and stage only files belonging to the current stage.

## Architecture Constraints

- Target stack: Next.js App Router, TypeScript, Node.js 22+, Supabase, Tailwind/shadcn-style UI, `dnd-kit`, Zod, Vitest, Playwright, Vercel.
- PPTX routes must declare Node runtime, never Edge. Generator uses one `pptx-automizer` instance per generation and returns a `Buffer`; it must consume independent `PresentationInput`, never query DB.
- Treat Vercel filesystem as temporary. Store templates/generated PPTX in private Supabase Storage; do not use Office, LibreOffice, Python, or persistent local files in server generation.
- Apply migrations `0001_initial_schema.sql` through `0006_report_status_lifecycle.sql` in order. Keep `generated-presentations` and `presentation-templates` buckets private; no service-role key is used by app.
- Template uploads require `template_admins` allowlist. Template path is `status-weekly/<version>/template.pptx`; configured version defaults to `v1` via `PPTX_TEMPLATE_VERSION`.

## PPTX Invariants

- Reuse `Template(1).pptx` as visual master; preserve shapes, icons, fonts, colors, and positions. Do not replace template PPTX icons with Lucide.
- Exclude template slides 1–3. Final order: cover, summary, deliveries, incidents, demands, support, attention.
- Keep empty sections with their absence message; never expose placeholders.
- Preserve board order; paginate deliveries by 4, incidents by 2, support fronts by 2, demands by 1 slide each.
- Calculate summary from content, update generated page numbers, and validate content limits before generation; dependency owner and waiting date are mandatory.
- Real PPTX integration requires the reviewed template at `presentation-templates/status-weekly/v1/template.pptx`; do not fabricate a fixture/template. ZIP checks must cover required XML, slide count/text, excluded slides, placeholders, CRC/corruption.

## UI Skills

- For UI work consult `.opencode/skills/ui-styling/SKILL.md` and `.opencode/skills/ui-ux-pro-max/SKILL.md`; for tokens/slides consult `.opencode/skills/design-system/SKILL.md`.
