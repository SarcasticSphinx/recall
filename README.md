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

Next.js App Router, React, TypeScript, Tailwind/CSS animations, Neon Postgres, Prisma, Better Auth, ts-fsrs, Zod, shadcn/Radix, Lucide React, and lazy-loaded Tiptap. Cloudinary handles media; OpenRouter is the selected AI provider.

Implemented: Light/Dark/System themes, a centered animated sign-in dialog, Today dashboard, deck/card management, card search, keyboard-accessible review sessions, anytime selected-card practice, installable PWA, FSRS scheduling, summaries, preferences, browser preview, authenticated workspace API, Prisma migrations, Google auth configuration, Focus/Canvas card authoring, question and answer images, deck covers/icons, and rotating page copy.

Pending: live cloud/auth integration verification, authenticated AI workflow verification, deployment. Account deletion/export and backup operations remain outside this first slice.

See the [SRS](docs/SRS.md), [setup guide](docs/development.md), and [implementation notes](docs/implementation.md).

## Optional integrations

Configure the server-only `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to enable image uploads for signed-in accounts. Configure `OPENROUTER_API_KEY` and a structured-output-compatible `OPENROUTER_MODEL` to enable **Draft with AI** inside a deck. Notes become editable drafts; only selected cards are saved after approval. See the [development guide](docs/development.md) for limits and setup.

## Study on your terms

Use **Choose cards to study** on Today or **Study deck** inside a deck. The shadcn sheet supports deck selection, question/answer search, Due/New/Learning/Previously forgotten filters, individual selection, shuffle, and session size.

**Scheduled** uses eligible cards and updates FSRS after each rating. **Free practice** includes future and new cards regardless of the daily new-card allowance. It records activity but preserves review dates, scheduling state, and card versions; it does not consume the new-card allowance.

## Install Recall

Preferences includes installation controls and device instructions. On iPhone/iPad use **Share → Add to Home Screen**; on Mac Safari use **File → Add to Dock**. Supporting Chromium browsers offer an Install Recall button. Serve production over HTTPS (localhost is allowed for testing).

The production service worker caches public icons and a reconnect page. Cloud cards, reviews, AI, and uploads require a connection; this release does not provide offline cloud review or queued sync. Updates wait for an explicit reload, and the workspace defers the reload button during editing or study. Development does not register the worker.

To check installation assets locally: `npm run build -- --webpack`, then `npm start`. Inspect `/manifest.webmanifest`, `/sw.js`, and `/offline.html` on the production server.
