# Development

## Local setup

Use a supported Node.js LTS release, 22.18 or newer. Run `npm ci`, then `npm run dev`. Open http://localhost:3000. The scaffold needs no credentials.

Checks: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. See [implementation notes](implementation.md) for current coverage and limits.

## Initialization verification

Lint and TypeScript checks pass. This managed environment blocks the local worker port required by Turbopack, including when the build was retried with elevated permissions. Use `npm run build -- --webpack` for the production build here. Tailwind uses PostCSS so styles compile with either bundler.

The initial npm audit reports five high-severity entries in the development-only ESLint dependency chain, originating in `braces`. npm proposes a major downgrade of `eslint-config-next`; that incompatible downgrade has not been applied. `npm audit --omit=dev` reports zero production vulnerabilities. Recheck the audit before deployment and update tooling when a compatible fix is available.

## External setup still required

### Neon and Prisma

Configure `DATABASE_URL` for runtime queries and `DIRECT_URL` for migrations. The initial schema and SQL migration are in `prisma/`. Review the target database and migration, then run `npm run db:deploy`. Run `npm run db:generate` after schema changes. Installation generates the client automatically but does not apply migrations. For later local schema work, use `npm run db:migrate -- --name descriptive_name`.

The initial migration has not been applied to the owner's database. Do not run `migrate reset` against a shared database.

### Google and Better Auth

Create Google OAuth credentials for a web application and configure the consent screen. Register `http://localhost:3000/api/auth/callback/google` and the production equivalent. Configure test users while OAuth is in testing mode.

Set `BETTER_AUTH_URL`, a secure `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` in `.env`. Use the same hostname as `BETTER_AUTH_URL` to test sign-in. Auth routes and the Prisma adapter are implemented; missing credentials produce a clear setup message instead of a fake account.

The signed-out preview saves to browser storage. Signed-in accounts use `/api/workspace`; preview data is never silently uploaded or merged into an account.

### AI

Choose the first workflow before selecting a model or installing an SDK. Store credentials on the server; never use `NEXT_PUBLIC_` variables for keys.

## Implementation milestones

1. Agree on the study interaction and first AI scope.
2. Build deck/card editing and review UI.
3. Configure Neon, Prisma models, and Google authentication.
4. Persist reviews and FSRS scheduling with retry and concurrency protection.
5. Validate cross-device behavior, accessibility, and failure recovery.
6. Add the selected AI workflow, installation support, and deployment.

This is a starting sequence, not a fixed delivery schedule.
