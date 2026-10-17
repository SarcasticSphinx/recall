# Recall — Software Requirements Specification

Version: 0.2

Date: 17 October 2026  
Status: Initial requirements baseline for review  
Product: Recall, a dedicated active recall application

## 1. Purpose and interpretation

This document consolidates the product, design, and technical discussions for Recall. It describes the intended product; it does not imply that the requirements are already implemented.

Requirement labels distinguish decisions from recommendations:

- **Confirmed:** explicitly chosen or requested by the product owner.
- **Baseline:** recommended behavior from the discussion, specified here to make the MVP implementable and testable; subject to product review.
- **Proposed:** an option or target awaiting a decision.
- **Future:** outside the initial release.

“Shall” describes required behavior within the applicable release scope. Proposed and future items are not release blockers unless promoted into that scope.

## 2. Product vision and objectives

Recall shall provide a minimal, interactive, animated environment for practicing active recall. The initial learning format is flashcards. The product should make it easy to create study material, attempt retrieval, and return for the next review.

The core promise is: **Open the app, recall something, and know what to review next.**

Primary objectives:

1. Support short, focused study sessions with little interface friction.
2. Persist personal learning material and progress across devices.
3. Combine answer retrieval with a spaced repetition schedule.
4. Incorporate useful AI assistance through editable notes-to-cards drafts.
5. Establish a web foundation that can support a later React Native client.

The app shall work on the web, including the owner's Mac and iPhone browsers. Native mobile development is a later phase. No delivery date, traffic target, or operating budget has been agreed.

## 3. Users and operating environment

| Actor                   | Capabilities                                                             |
| ----------------------- | ------------------------------------------------------------------------ |
| Visitor                 | View the entry screen and initiate sign-in                               |
| Authenticated learner   | Manage personal decks/cards, study, and view personal progress           |
| Product owner/developer | Configure and deploy services; no in-app administrator role is specified |

The initial product assumes an internet connection and one owner per deck. Shared decks, organizations, and collaboration roles are not part of the baseline.

**Proposed browser target:** current stable Safari on macOS and iOS, and Chrome on desktop, at release testing. Exact minimum browser/OS versions remain to be recorded before release.

## 4. Scope and release boundaries

| Capability                                   | Status              | Initial release treatment                  |
| -------------------------------------------- | ------------------- | ------------------------------------------ |
| Responsive web app with minimal, animated UI | Confirmed           | Required                                   |
| Flashcards as the initial learning format    | Confirmed           | Required                                   |
| Accounts and access across devices           | Confirmed           | Required                                   |
| Google sign-in through Better Auth           | Baseline            | First authentication method                |
| Deck and card management                     | Baseline            | Required                                   |
| Review ratings and FSRS scheduling           | Baseline            | Required                                   |
| Today screen and session summary             | Baseline            | Required                                   |
| Daily new-card limit and timezone            | Baseline            | Required                                   |
| AI integration                               | Confirmed direction | First feature and release timing undecided |
| Installable web experience                   | Proposed            | Follow-up polish; scope decision pending   |
| React Native app                             | Future              | Reuse backend when introduced              |

Deferred features: offline reviewing and reconciliation, public/shared decks, collaboration, payments, general file uploads, advanced analytics, streak systems, reminders, and complex gesture interactions. These exclusions do not rule them out permanently.

## 5. Primary user journeys

### 5.1 First use

The learner opens Recall, signs in, creates a deck, adds a question and answer, and starts studying. Empty states shall make the next useful action clear.

### 5.2 Daily study

The learner opens Today, sees cards ready for practice, starts a session, attempts each answer, reveals it, and rates recall. Recall saves the result, calculates the next review, and presents a completion summary.

### 5.3 Cross-device continuation

The learner creates material on Mac, signs into the same account on iPhone, studies it, and returns to Mac. After refresh or focus revalidation, the Mac shows the saved material and updated progress.

### 5.4 Candidate AI workflow

The learner pastes notes, requests draft flashcards, reviews and edits the output, and explicitly saves selected cards. This is the recommended first experiment, not a committed release feature.

## 6. Functional requirements

### 6.1 Accounts and access

| ID      | Requirement                                                                                                                          | Status   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| AUTH-01 | The system shall provide Google sign-in through Better Auth.                                                                         | Baseline |
| AUTH-02 | First successful sign-in shall create an app account; later sign-ins using the same provider identity shall resolve to that account. | Baseline |
| AUTH-03 | Each device shall have its own session while accessing the same account data.                                                        | Baseline |
| AUTH-04 | The learner shall be able to sign out of the current device.                                                                         | Baseline |
| AUTH-05 | The server shall require a valid session for private data and verify ownership on every protected read and mutation.                 | Baseline |
| AUTH-06 | Cancelled/failed sign-in and expired sessions shall show recoverable states without exposing private content.                        | Baseline |

Password registration, password resets, and additional providers are deferred. Cross-device access does not require a custom account system separate from Better Auth.

### 6.2 Decks and cards

| ID      | Requirement                                                                                                     | Status   |
| ------- | --------------------------------------------------------------------------------------------------------------- | -------- |
| DECK-01 | The learner shall be able to list, create, rename, and delete personal decks.                                   | Baseline |
| DECK-02 | Deck deletion shall require explicit confirmation describing its effect on cards and progress.                  | Baseline |
| CARD-01 | The learner shall be able to create, view, edit, and delete cards within a personal deck.                       | Baseline |
| CARD-02 | Each card shall have a nonempty question and answer content; rich answers may contain an image instead of text. | Baseline |
| CARD-03 | The server shall validate input and return actionable validation errors.                                        | Baseline |
| CARD-04 | Failed writes shall preserve entered text where feasible and shall not be presented as successful saves.        | Baseline |
| CARD-05 | Ordinary text edits shall preserve scheduling history; an explicit reset feature is outside initial scope.      | Proposed |

Maximum field lengths, deletion retention, and the treatment of history after deletion must be finalized before the schema and destructive operations are implemented.

### 6.3 Study and scheduling

| ID       | Requirement                                                                                                                                      | Status   |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| STUDY-01 | Study mode shall display one question at a time with its answer initially concealed.                                                             | Baseline |
| STUDY-02 | An explicit Show answer action shall reveal the answer. Recall ratings shall become available only after reveal.                                 | Baseline |
| STUDY-03 | The learner shall rate recall with Again, Hard, Good, or Easy.                                                                                   | Baseline |
| STUDY-04 | The system shall use ts-fsrs to calculate scheduling state and the next due time from the accepted review.                                       | Baseline |
| STUDY-05 | The server shall save the review event and scheduling update atomically before acknowledging a successful rating.                                | Baseline |
| STUDY-06 | Repeating a submission with the same operation identifier shall not create a second review.                                                      | Baseline |
| STUDY-07 | A stale review from another device shall not silently overwrite newer scheduling state; the client shall refresh and show a recoverable message. | Baseline |
| STUDY-08 | A save failure shall allow retry without losing the current card or silently advancing progress.                                                 | Baseline |
| STUDY-09 | The learner shall be able to leave a session; already acknowledged reviews shall remain saved.                                                   | Baseline |
| STUDY-10 | The completion screen shall show the number of successfully reviewed cards and a clear next action.                                              | Baseline |
| STUDY-11 | Desktop controls shall support Space to reveal and keys 1–4 for ratings in displayed order, without firing while typing in inputs.               | Baseline |

Initial reviews use library-supported scheduler settings rather than a custom scheduling algorithm. Exact retention settings, initial learning/relearning steps, queue ordering, and handling of cards becoming due during a session remain open decisions. No automatic AI grading is required.

### 6.4 Today, preferences, and synchronization

| ID      | Requirement                                                                                                                                                                 | Status    |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| HOME-01 | Today shall display due-card and available-new-card counts and a primary Start review action.                                                                               | Baseline  |
| HOME-02 | The interface shall explain empty states, including no decks, no cards, and no cards ready to study.                                                                        | Baseline  |
| PREF-01 | The learner shall be able to configure a daily new-card limit and timezone.                                                                                                 | Baseline  |
| PREF-02 | A new card shall be one with no accepted reviews. Daily introduction counts shall use the learner's configured local date.                                                  | Baseline  |
| PREF-03 | The learner shall be able to select Light, Dark, or System appearance. This preference shall persist per browser/device; System shall respond to device appearance changes. | Confirmed |
| SYNC-01 | Server-persisted data shall be the source of truth across signed-in devices.                                                                                                | Baseline  |
| SYNC-02 | The app shall revalidate relevant data on navigation and when returning to focus.                                                                                           | Baseline  |
| SYNC-03 | Without connectivity, the app shall clearly report that changes/reviews cannot be saved. Offline review queues are deferred.                                                | Baseline  |

The default daily limit and timezone-change behavior are undecided. A session's exact cursor need not transfer between devices; saved review progress must transfer. Immediate push updates and WebSockets are not baseline requirements.

## 7. AI requirements and decision boundary

OpenRouter is the selected AI provider. A configurable server-only client is implemented; notes-to-cards with editable approval is implemented, while the deployment model remains configurable. Availability and pricing must be checked when choosing the model.

| Candidate                 | Intended value                             | Status                       |
| ------------------------- | ------------------------------------------ | ---------------------------- |
| Notes to flashcard drafts | Reduce the effort to create study material | Recommended first experiment |
| Improve/split a card      | Make questions clearer and more focused    | Proposed                     |
| Explain an answer         | Support understanding after retrieval      | Proposed                     |
| Summarize source material | Prepare material for study                 | Proposed                     |

The following requirements become mandatory for any AI workflow selected for implementation:

| ID    | Conditional requirement                                                                                               |
| ----- | --------------------------------------------------------------------------------------------------------------------- |
| AI-01 | Provider calls and secret keys shall remain on the server.                                                            |
| AI-02 | Provider and model selection shall be configurable in a server-side integration module.                               |
| AI-03 | Generated card content shall be validated and presented as editable drafts requiring explicit approval before saving. |
| AI-04 | AI errors, timeouts, and quota exhaustion shall preserve user input and provide a recovery action.                    |
| AI-05 | The system shall track per-user usage and enforce application-level limits before incurring additional requests.      |
| AI-06 | The interface shall identify when supplied material is being sent to an external AI service.                          |
| AI-07 | Core manual card creation and reviewing shall remain usable when AI is unavailable.                                   |
| AI-08 | Source-derived cards shall retain a source reference where available so the learner can check the answer.             |

OpenRouter is confirmed; no model, free-tier assumption, SDK, vector database, chatbot, or autonomous agent framework is mandated. Input/output limits, cost allowance, retries, source retention, and AI quality evaluation criteria must be selected with the first workflow.

## 8. Interface and interaction requirements

The confirmed direction is minimal, interactive, and animated. The **proposed** visual theme is a quiet study desk: warm ivory surfaces, charcoal text, a muted indigo accent, subtle borders, and generous spacing. Exact brand tokens and typography remain open. Light, Dark, and System appearance modes are now required; dark uses warm charcoal and muted lavender.

| ID    | Requirement                                                                                                     | Status   |
| ----- | --------------------------------------------------------------------------------------------------------------- | -------- |
| UX-01 | Core flows shall work on narrow mobile and desktop layouts without horizontal page scrolling.                   | Baseline |
| UX-02 | Study mode shall prioritize the question, answer reveal, rating controls, and session progress.                 | Baseline |
| UX-03 | Answer reveal, card transitions, button presses, and progress changes shall provide restrained feedback.        | Baseline |
| UX-04 | Animations shall not delay repeated reviews and shall respect reduced-motion preferences.                       | Baseline |
| UX-05 | Core controls shall have visible keyboard focus, accessible names, and touch-friendly sizing.                   | Baseline |
| UX-06 | Loading, validation, save success, and failure states shall be distinguishable without relying solely on color. | Baseline |

Proposed animation duration: approximately 150–250 ms. CSS transitions/keyframes are the initial implementation choice. Motion/Framer Motion may be added later if gestures or coordinated animations warrant it. Swiping is optional future polish, not the only way to answer.

Expected screens: entry/sign-in, Today, deck list, deck detail/card management, card editor, study session, completion, and preferences. These may share layouts; separate routes are not mandated.

## 9. Data requirements

This is a conceptual model, not a finalized Prisma schema.

| Entity                   | Required information                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| User                     | Stable account identity and profile managed with Better Auth                                                      |
| Provider account/session | Better Auth's required identity linkage and session data                                                          |
| Deck                     | Identifier, owner, name, creation/update timestamps                                                               |
| Card                     | Identifier, deck, question, answer, creation/update timestamps                                                    |
| Scheduling state         | Library-required FSRS fields, due time, last review, concurrency version                                          |
| Review event             | User/card reference, rating, server timestamp, operation identifier, scheduling result needed for audit/debugging |
| Preferences              | User timezone and daily new-card limit                                                                            |
| AI usage/source data     | Conditional on the chosen AI workflow                                                                             |

Ownership relationships shall be enforceable by server queries. Review event history shall be distinct from mutable scheduling state. The schema shall support unique operation identifiers and the indexes needed for ownership and due-card queries. Timestamps shall be stored consistently in UTC; local dates shall be derived using user timezone preferences.

Use Better Auth's supported schema generation for its models. Review migrations before applying them. Cascading deletion, backups, retention, and account deletion/export remain decisions to resolve before public launch.

## 10. Technical architecture and constraints

| Layer              | Decision                                       | Status                    |
| ------------------ | ---------------------------------------------- | ------------------------- |
| Web and backend    | Next.js App Router + React + TypeScript        | Confirmed stack direction |
| Styling            | Tailwind CSS                                   | Baseline                  |
| Animation          | CSS initially                                  | Baseline                  |
| Database           | Neon Postgres                                  | Confirmed                 |
| ORM                | Prisma, preferred because of owner familiarity | Confirmed                 |
| Authentication     | Better Auth with Google as first provider      | Baseline                  |
| Scheduling         | ts-fsrs                                        | Baseline                  |
| Runtime validation | Zod                                            | Baseline                  |
| Hosting            | Vercel                                         | Proposed                  |
| Native mobile      | React Native; Expo integration to evaluate     | Future                    |

Request flow:

```text
Mac browser / iPhone browser
            |
            v
Next.js UI and server entry points
            |
      Auth and ownership checks
            |
       Domain services
         /         \
 Prisma -> Neon    AI provider (when implemented)
```

Business operations and scheduler integration shall be separated from React components. A future native client may call authenticated Next.js endpoints that reuse those services. Shared domain types and validation can be extracted later; a monorepo or separate backend service is not required initially.

Google verifies identity, Better Auth manages the app account/session, Prisma accesses storage, and Neon persists it. Configure development and production OAuth callbacks for `/api/auth/callback/google`. Keep credentials in server environment configuration.

Recall provides an installable web manifest, standalone display, home-screen icons, installation guidance, and a production service worker with a public offline reconnect page. Cloud cards and mutations require connectivity. Offline cloud review and queued synchronization require a separate design.

## 11. Nonfunctional requirements

| ID     | Requirement                                                                                                             | Verification                                                          |
| ------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| NFR-01 | Private data access shall be isolated per user on the server.                                                           | Attempt cross-account reads/mutations, including guessed identifiers. |
| NFR-02 | Production traffic shall use HTTPS; sessions and secrets shall use the auth library's secure production configuration.  | Deployment and session configuration review.                          |
| NFR-03 | Invalid data and unauthorized requests shall not mutate stored study data.                                              | Boundary and authorization checks.                                    |
| NFR-04 | An acknowledged review shall survive page reload and sign-in on a second device.                                        | Cross-device persistence scenario.                                    |
| NFR-05 | Duplicate/stale submissions shall preserve consistent review and scheduling data.                                       | Retry and simultaneous-device scenarios.                              |
| NFR-06 | Study interactions shall remain usable with keyboard and reduced motion enabled.                                        | Manual accessibility verification.                                    |
| NFR-07 | Errors shall be observable without logging secrets, raw session tokens, or full study/AI source content by default.     | Logging review.                                                       |
| NFR-08 | Schema changes shall be represented by reviewed migrations; production migrations shall be deliberate deployment steps. | Migration/deployment review.                                          |

**Proposed accessibility target:** WCAG 2.2 AA for core flows, with at least 44 × 44 CSS-pixel primary touch targets. This is a target for implementation review, not a certification claim.

**Proposed performance targets:** local reveal/rating feedback within 100 ms excluding server persistence; an interactive Today screen within 2.5 seconds under an agreed mobile test profile. Network conditions, dataset size, percentile, and hosting region must be specified before these become release gates. AI latency shall be measured separately.

No fixed uptime guarantee, concurrent-user capacity, or recovery-time objective has been agreed. Resolve backup ownership and recovery expectations before public launch.

## 12. Acceptance scenarios and release gates

| ID    | Scenario and expected outcome                                                                                                                      | Coverage                   |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| AC-01 | Sign in on Mac and iPhone with the same Google identity; both resolve to the same account. Sign-out on one device ends that session.               | AUTH-01–04                 |
| AC-02 | A second user cannot list, read, modify, or delete the first user's decks/cards through server entry points.                                       | AUTH-05, NFR-01            |
| AC-03 | Create, rename, and delete a deck; create/edit/delete cards; empty questions/answers are rejected.                                                 | DECK-01–02, CARD-01–03     |
| AC-04 | Start a review: the answer is hidden, reveal makes it visible, and each rating saves a review and scheduling update.                               | STUDY-01–05                |
| AC-05 | Submit the same review twice and a stale review from another device; the first is applied once and the stale write is rejected/recovered.          | STUDY-06–07, NFR-05        |
| AC-06 | Interrupt connectivity during a save; the app reports failure, preserves the current interaction, and can retry without double counting.           | CARD-04, STUDY-08, SYNC-03 |
| AC-07 | Finish or leave a session, reload, and open another device; accepted reviews remain saved and due state refreshes.                                 | STUDY-09–10, SYNC-01–02    |
| AC-08 | Set a new-card limit and timezone; verify the limit and local-day introduction count under the chosen policy.                                      | PREF-01–02                 |
| AC-09 | Exercise core flows at mobile/desktop widths, with keyboard controls and reduced motion enabled.                                                   | STUDY-11, UX-01–06         |
| AC-10 | When AI ships, generate editable drafts, approve selected cards, simulate provider failure/quota exhaustion, and confirm manual study still works. | AI-01–08, conditional      |

Before release, the selected scope shall pass relevant acceptance scenarios, lint, type checking, and a production build. Database migrations, deployment configuration, and the dependency audit shall be reviewed. No unresolved question may silently determine data-loss behavior, access control, or billable AI behavior.

## 13. Implementation state and milestones

At the initial requirements baseline, only the scaffold existed. The first implementation slice now includes the dashboard, deck/card management, browser preview, FSRS review flow, preferences, Prisma schema and migration, and auth/API foundation. See [implementation notes](implementation.md) for defaults and verification evidence. Authenticated browser verification and deployment remain pending; provider connectivity and the notes-to-cards implementation are complete.

Development-specific build and audit findings belong in [development.md](development.md); they are not product requirements.

Suggested milestones:

1. Review this baseline and settle the study interaction and initial AI scope.
2. Implement the core deck/card and review interface.
3. Configure Neon, Prisma models, and Google authentication.
4. Persist reviews and scheduling with retry and concurrency protection.
5. Verify the Mac → iPhone → Mac workflow and accessibility.
6. Implement the selected AI workflow and deployment/installation scope.

The first complete product milestone is creating a deck on Mac, reviewing it on iPhone, and seeing correct saved progress and next due dates back on Mac.

## 14. Open decisions

| ID      | Decision needed                                                                      | Resolve before                             |
| ------- | ------------------------------------------------------------------------------------ | ------------------------------------------ |
| OPEN-01 | Deployment AI model and production readiness                                         | AI implementation and release scope freeze |
| OPEN-02 | AI quotas, spend allowance, input limits, retries, and output quality criteria       | Billable AI requests                       |
| OPEN-03 | Default daily limit, timezone initialization/change behavior, and queue ordering     | Scheduler and Today implementation         |
| OPEN-04 | FSRS initial settings and learning/relearning behavior                               | Scheduling acceptance tests                |
| OPEN-05 | Card/deck field limits and card-edit scheduling policy                               | Schema and editor implementation           |
| OPEN-06 | Deletion/retention policy, account deletion/export, and backup/recovery expectations | Destructive operations and public launch   |
| OPEN-07 | Final brand tokens, typography, and installation scope                               | UI polish                                  |
| OPEN-08 | Hosting, deployment/DB regions, domain, and browser/performance test profiles        | Deployment and release validation          |

## 15. Related documents and maintenance

- [Documentation index](README.md)
- [Product overview](product.md)
- [Architecture notes](architecture.md)
- [Development setup](development.md)

This SRS is the consolidated requirements baseline. Keep the shorter companion documents aligned with it. Record scope changes by updating the relevant requirement/status and document version; do not treat proposed features as approved solely because they appear here.

## Rich authoring and media revision — 17 October 2026

- Preferences shall offer Focus and Canvas authoring. Both question and answer support rich formatting and image uploads; existing formatting remains visible in either preference.
- Both card sides may attach Cloudinary images. Questions may also attach images alongside their text prompt. Uploads require an authenticated account and configured server credentials.
- Decks may use a selected Lucide icon or a Cloudinary cover image. The selected icon remains visible as a badge when a cover is present.
- Uploads accept JPEG, PNG, or WebP up to 5 MB, validate file content on the server, and allow at most 30 uploads per account per hour.
- Interface controls use Lucide React icons. Dropdowns, selects, and editing dialogs use shadcn components while retaining the established appearance.
- Page headings and supporting copy rotate from a local copy library on refresh; copy requires no AI calls.
- Workspace state, navigation, pages, editing, and review shall be maintained as focused components and hooks.

## Collection polish and AI revision

The Recall brand retains its original stacked-note SVG, separate from general Lucide icons. Authoring modes are named Focus and Canvas. Cover images support drag-and-drop or file selection, replacement and removal. Image links are not offered as an attachment method.

Save notices use shadcn Sonner; decks offer Cards/Table tabs with search, sorting, pagination and actions. The Today chart displays actual review activity for the last seven local days.

The first AI workflow is notes-to-cards: 80–12,000 characters of notes, 1–5 draft questions, editable review, selection and explicit saving. Only authenticated users can generate. Each account has five attempts per rolling 24 hours, reserved before provider calls. Source notes are retained privately and accessible on saved cards. Invalid output or provider failure preserves the open notes. Closing/reloading discards unsaved drafts. Model calls are time/output bounded, do not use tools and do not automatically retry. Provider spend limits and live verification remain deployment requirements.

## Flat surfaces and card attachments revision

Use solid surfaces without gradients. Cover, upload hints, icon controls, and form inputs must not overlap at mobile or desktop widths. Focus and Canvas both offer file upload buttons on question and answer fields, without image URL entry. Focus edits retain attachments. Startup failures offer retry and reauthentication; cached database clients must refresh after model regeneration during development, while OAuth state checks remain enforced.

## Deferred image saves and study display

File selection creates a local preview only. Save validates the draft first, uploads only images still referenced by the final document or cover, replaces local references with Cloudinary URLs, then persists the card/deck. Cancel does not upload files. A failed save keeps the open draft and reuses successful uploads on retry. Unsaved files are released when the editor closes; there is no draft backup across reloads.

Question and answer image actions are icon buttons in the formatting toolbar. Practice shows question images immediately, conceals answer images until reveal, and requests those images eagerly when their section is mounted. The latest editor document must be read at Save. Deck icons remain visible with covers, and the weekly chart is the first section after the Today heading.

## Anytime review and PWA update — 18 October 2026

- Scheduled review retains FSRS eligibility, daily new-card limits, version checks, and idempotency. Ratings update the schedule.
- Free practice allows any owned cards, including future reviews and new cards above the daily allowance. Ratings count as practice activity, preserve card schedule/version, and do not count as new introductions. Review events record their mode; legacy events default to scheduled.
- The accessible shadcn Sheet provides deck scope, question/answer search, due/new/learning/previously forgotten filters, per-card selection, shuffle, and bounded session size. Selection is validated again at session start and ownership/version is checked when saving.
- PWA installation uses the existing Recall brand, regular and maskable icons, standalone display, safe-area support, theme-aware browser color, and device-specific instructions in Preferences.
- The production worker caches only public icons and the offline page. It bypasses APIs, mutations, external resources, user images, and account HTML. Updates require explicit reload; active editing and study defer the workspace update control.
- Installation requires HTTPS or localhost. Real device installation and authenticated cross-device behavior remain release verification tasks. A network connection is required for cloud data and provider integrations.
