# Recall

A quiet space for active recall: personal flashcards, spaced repetition, and a little practice every day.

## Run locally

Use Node.js 22.18+ (a supported LTS release is recommended) and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. If Turbopack is restricted by your environment, use `npm run dev -- --webpack`.

Without Google credentials, Recall opens a labeled browser preview with sample cards. Create/edit decks and cards, review with FSRS, and change daily preferences. Preview changes are saved only in the current browser and are kept separate from cloud accounts. Do not use the preview as your only copy of important material.

## Connect your account

1. Copy `.env.example` to `.env` and configure Neon connection strings.
2. Generate a secure `BETTER_AUTH_SECRET` and set `BETTER_AUTH_URL`.
3. Set up Google's OAuth web client and configure its client ID and secret.
4. Review the initial SQL migration, then run `npm run db:deploy` against the intended database.
5. Restart the app and use **Sign in to sync**.

Local Google callback: `http://localhost:3000/api/auth/callback/google`. Register the matching production callback before deployment. Use the same hostname as `BETTER_AUTH_URL` when testing sign-in.

No database migration is applied automatically. `npm ci` generates Prisma Client; it does not connect to or change the database. Google sign-in cannot be tested until credentials and the database migration are configured.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

For restricted environments, use `npm run build -- --webpack`.

## Stack and status

Next.js App Router, React, TypeScript, Tailwind/CSS animations, Neon Postgres, Prisma, Better Auth, ts-fsrs, and Zod.

Implemented: Light/Dark/System themes, a centered animated sign-in dialog, Today dashboard, deck/card management, card search, keyboard-accessible review sessions, FSRS scheduling, summaries, preferences, browser preview, authenticated workspace API, Prisma schema/initial migration, and Google auth configuration.

Pending: live cloud/auth integration verification, AI workflow selection and integration, installation support, and deployment. Account deletion/export and backup operations remain outside this first slice.

See the [SRS](docs/SRS.md), [setup guide](docs/development.md), and [implementation notes](docs/implementation.md).
