# status-board

## Tests

Run unit tests with `npm test`. Run browser E2E tests with `npm run test:e2e`.

E2E tests are intentionally skipped unless `E2E_RUN=true` and the required values
from `.env.example` are set. See [docs/e2e.md](docs/e2e.md) for the isolated
Supabase account, migrations, template, and browser prerequisites.
