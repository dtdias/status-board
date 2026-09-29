# Agent Instructions

## Repository State

- `PRD.md` is current functional and technical source of truth; read relevant sections before changing architecture or PPTX behavior.
- Repository currently contains no app source, package manifest, lockfile, test config, CI workflow, or executable build/test command. Do not invent commands; inspect newly added manifests first.
- `README.md` is only a project title and adds no setup guidance.

## Architecture Constraints

- Target stack: Next.js App Router, TypeScript, Node.js 22+, Tailwind/shadcn-style accessible UI, Supabase, `dnd-kit`, Zod, Vitest, Playwright, Vercel.
- PPTX generation must run in Vercel Node runtime (`runtime = "nodejs"`), never Edge; do not use Office, LibreOffice, or Python in the server path.
- Treat function filesystem as temporary. Pass PPTX through `Buffer`/streams and persist templates/generated files in Supabase Storage; `/tmp` is execution-only.
- Keep business logic in `lib/`; PPTX layer consumes an independent `PresentationInput` DTO and must not query the database directly.
- Use one `pptx-automizer` instance per generation. Confirm installed-library API against the actual dependency version.

## PPTX Invariants

- Reuse `Template(1).pptx` as visual master; preserve its shapes, icons, fonts, colors, and positions where possible. Do not redraw the template or replace its PPTX icons with Lucide.
- Exclude template slides 1–3 from final output. Final order is cover, summary, deliveries, incidents, demands, support, attention.
- Empty sections remain present with the specified absence message. Never expose placeholders.
- Preserve board/card ordering in generated slides; paginate deliveries by 4, incidents by 2, support fronts by 2, and demands as 1 slide each.
- Calculate summary totals from content, not user input. Update generated page numbers; never trust template numbers.
- Validate character/layout limits before generation; do not shrink fonts indefinitely. Dependencies require owner and waiting date.

## Verification

- Generator tests must cover chunking, summary, status colors, demand phases, validation, cloning, and filename.
- PPTX integration fixture: 5 deliveries, 3 incidents, 2 demands, 3 support fronts; expected final deck has 11 slides: 1 cover, 1 summary, 2 deliveries, 2 incidents, 2 demands, 2 support, 1 attention.
- Inspect generated PPTX as ZIP. Verify required presentation/XML parts, expected slide count/text, no template slides 1–3, no placeholders, and no corruption.
- Before architecture changes, document concrete problem, alternatives, decision, and impact in the change context.

## Local Agent Skills

- For UI work, consult `.opencode/skills/ui-styling/SKILL.md` and `.opencode/skills/ui-ux-pro-max/SKILL.md`; for tokens or slide generation, consult `.opencode/skills/design-system/SKILL.md`.
