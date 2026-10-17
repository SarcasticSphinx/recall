# Recall

A minimal, web-first active recall app with flashcards, spaced repetition, and accounts across devices. AI assistance is a product requirement; its first workflow is still to be decided.

## Development

Use a supported Node.js LTS release (22.12+ recommended) and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000.

```sh
npm run lint
npm run typecheck
npm run build
```

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Neon Postgres, Prisma, Better Auth, ts-fsrs, and Zod. Use CSS for initial animations.

This is the project scaffold. Database models, authentication, flashcard features, and AI integration are not implemented yet. The starter runs without credentials.

Copy `.env.example` to `.env` when configuring services. Never commit credentials. No migrations run automatically.

Start with [docs/README.md](docs/README.md) for product scope, architecture, and next steps.

The [Software Requirements Specification](docs/SRS.md) consolidates the discussed product requirements and decisions.
