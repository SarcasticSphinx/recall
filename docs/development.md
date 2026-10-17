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

All three committed migrations have been applied to the configured development Neon database. Do not run `migrate reset` against a shared database.

### Google and Better Auth

Create Google OAuth credentials for a web application and configure the consent screen. Register `http://localhost:3000/api/auth/callback/google` and the production equivalent. Configure test users while OAuth is in testing mode.

Set `BETTER_AUTH_URL`, a secure `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` in `.env`. Use the same hostname as `BETTER_AUTH_URL` to test sign-in. Auth routes and the Prisma adapter are implemented; missing credentials produce a clear setup message instead of a fake account.

The signed-out preview saves to browser storage. Signed-in accounts use `/api/workspace`; preview data is never silently uploaded or merged into an account.

### AI

Set `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` (an OpenRouter model ID supporting structured outputs) in the server environment, then restart. The notes-to-cards flow calls `/api/ai/drafts`: signed-in users can generate up to five editable drafts from 80–12,000 characters of notes. Each user has five generation attempts per rolling 24 hours, reserved transactionally before the provider call; failed attempts count too. Requests cap output at 2,200 tokens and time out after 30 seconds. No automatic retry incurs a second charge.

Notes are sent to OpenRouter and the configured downstream provider only after the user clicks Generate. Source notes are stored in the account and attached to saved cards. They are not logged. Validate drafts against the source before selecting and saving them. Batch save uses stable card UUIDs to avoid duplicates after a lost response. AI cannot upload images, call tools, or modify existing cards. Set provider/account credit limits before deployment; application quotas are per user, not a global monetary cap. Never use `NEXT_PUBLIC_` variables for keys.

The configured OpenRouter model returned three valid drafts in a live sample-notes check. Cloudinary also passed a generated-image upload and test-asset cleanup check. Authenticated browser generation/upload flows still need end-to-end verification. Unsupported models fail with notes kept in the dialog. Close or reload intentionally discards unsaved notes/drafts; no automatic local or cloud draft backup is implemented.

## Implementation milestones

1. Agree on the study interaction and first AI scope.
2. Build deck/card editing and review UI.
3. Configure Neon, Prisma models, and Google authentication.
4. Persist reviews and FSRS scheduling with retry and concurrency protection.
5. Validate cross-device behavior, accessibility, and failure recovery.
6. Add the selected AI workflow, installation support, and deployment.

This is a starting sequence, not a fixed delivery schedule.

## Cloudinary media

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in the server environment, then restart. No unsigned upload preset is needed. The authenticated `/api/uploads` endpoint validates JPEG/PNG/WebP content, limits each image to 5 MB and uploads to `recall/<account-id>`. Images are resized to a maximum of 1600 × 1600. Accounts may upload 30 images per hour. Browser preview cannot upload media.

Cloudinary delivery URLs are public: use images appropriate for public delivery. Removing a cover/card reference does not delete its Cloudinary asset. Asset retention and cleanup of abandoned uploads remain follow-up work. A generated test image passed the live Cloudinary upload/cleanup check; the signed-in browser upload flow remains to be verified. Credentials are not included in the repository.

## Interface structure

`recall-app.tsx` composes the workspace provider and shell. Page/layout/editor components live in `src/components/workspace`; shared rich authoring lives in `src/components/editor`. State and actions live in `src/hooks/use-workspace-controller.ts`. shadcn primitives live in `src/components/ui` and use the existing theme tokens. Edit refresh copy in `src/lib/page-copy.ts`.

## Image draft lifecycle

The file picker performs no network requests. `use-pending-images.ts` owns browser object URLs and pending files while an editor is open. Save validates the final text/structure, uploads only referenced images, resolves their Cloudinary URLs, and sends the workspace mutation. Successful uploads are cached for retries within that dialog. Edits, Cancel, and removed/replaced selections do not trigger uploads. Closing the editor revokes object URLs; unsaved local previews are never sent to the workspace API or persisted as card content.

The rich editor exposes a current-document reader to Save rather than relying solely on parent update timing. Practice rendering has its own `ReviewCard` component and eagerly loads visible images. Tests render the real review card through the save/preview/queue path, check image conceal/reveal, cover icons, upload failure recovery, and retry caching. The TSX test loader provides JSX/alias support; the component test normalizes Node's Next Image import interop while retaining the real Image implementation.
