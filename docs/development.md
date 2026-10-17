# Development

## Local setup

Use a supported Node.js LTS release, 22.12 or newer. Run `npm ci`, then `npm run dev`. Open http://localhost:3000. The scaffold needs no credentials.

Checks: `npm run lint`, `npm run typecheck`, and `npm run build`.

## Initialization verification

Lint and TypeScript checks pass. This managed environment blocks the local worker port required by Turbopack, including when the build was retried with elevated permissions. Use `npm run build -- --webpack` for the production build here. Tailwind uses PostCSS so styles compile with either bundler.

The initial npm audit reports five high-severity entries in the development-only ESLint dependency chain, originating in `braces`. npm proposes a major downgrade of `eslint-config-next`; that incompatible downgrade has not been applied. `npm audit --omit=dev` reports zero production vulnerabilities. Recheck the audit before deployment and update tooling when a compatible fix is available.

## External setup still required

### Neon and Prisma

Create a Neon database. Use its pooled URL for application queries and direct URL for migrations. Initialize Prisma configuration and schema, add Better Auth's generated models and application models, and review migrations before applying them. The Neon driver adapter is installed for runtime queries. No database has been provisioned or migrated.

### Google and Better Auth

Create Google OAuth credentials for a web application and configure the consent screen. Register `http://localhost:3000/api/auth/callback/google` and its production equivalent. Add test users while Google OAuth is in testing mode.

Copy `.env.example` to `.env`, provide credentials, and generate a secure Better Auth secret. Implement the Prisma-backed auth configuration and Next.js handler. Auth is not wired in this scaffold.

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
