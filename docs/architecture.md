# Architecture

## Decisions

| Area | Decision | Reason |
| --- | --- | --- |
| Web and backend | Next.js App Router + TypeScript | One project for web and server |
| Styling | Tailwind CSS | Responsive styling |
| Animation | CSS initially | Initial interactions do not require Motion |
| Database | Neon Postgres | Persistent data across devices |
| ORM | Prisma | Owner familiarity; chosen over Drizzle |
| Authentication | Better Auth + Google | Accounts and sessions without password flows |
| Scheduling | ts-fsrs | Existing TypeScript FSRS implementation |
| Validation | Zod | Runtime validation at server boundaries |
| Hosting | Vercel proposed | Deployment setup pending |
| AI | Server-side integration | Feature, SDK, provider, and model pending |

## Authentication and requests

Mac and iPhone browsers call the same Next.js app. Server services use Prisma to access Neon. Better Auth manages users, provider accounts, and sessions through its Prisma adapter. Google verifies identity; each device receives a session for the same app user.

Every server read and mutation must verify the session and resource ownership. Never trust client-supplied user IDs for authorization. Database credentials, OAuth secrets, and AI keys remain on the server.

## Data design to implement

Use Better Auth's generated schema for authentication tables. Design decks, cards, scheduling state, and review events after confirming the flow. Preserve review events separately from mutable scheduling state.

Save each review and scheduling update atomically. Use idempotent submissions and concurrency checks to protect against retries and simultaneous reviews. Store timestamps in UTC and use the user's timezone for daily boundaries.

Initially refresh server state on navigation and app focus. Realtime subscriptions and offline write queues are deferred.

## Future mobile app

Keep business operations separate from React components. Next.js route handlers can expose authenticated endpoints for Expo later. Share validation and domain types when needed; a monorepo is unnecessary initially.

## AI boundary

Keep provider calls in a server module and model selection in configuration. Validate outputs, track per-user usage, and enforce application request and spend limits when AI is implemented. Preserve source references for generated cards. No vector database is currently required.

## References

- https://nextjs.org/docs/app
- https://www.prisma.io/docs
- https://better-auth.com/docs/adapters/prisma
- https://better-auth.com/docs/authentication/google
- https://better-auth.com/docs/integrations/next
- https://github.com/open-spaced-repetition/ts-fsrs
