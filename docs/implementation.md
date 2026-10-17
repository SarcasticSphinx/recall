# First implementation slice

Date: 17 October 2026

## Delivered

- Responsive Today screen with daily practice, counts, and deck previews
- Deck creation, rename, and confirmed permanent deletion
- Card creation, editing, deletion, and text search
- One-question review flow, explicit reveal, four FSRS ratings, and completion summary
- Space to reveal and 1–4 to rate; native dialogs for focus containment
- Daily new-card limit and timezone preferences
- Labeled browser preview, separate from signed-in cloud data
- Prisma data model and reviewed initial migration file
- Better Auth Google configuration and protected workspace API
- Server ownership checks, review idempotency, version checks, and transactional review writes

## Implementation decisions

- New-card default: 20 per day. Accounts start in UTC; users can change timezone in preferences. The browser preview starts in the device timezone.
- Due cards appear first in due-time order, then new cards in creation order.
- New-card introductions count across all decks. Repeated reviews do not consume additional new-card allowance.
- FSRS uses library defaults with fuzz disabled for reproducible results. The current learning steps may make a card due again later the same day.
- Sessions contain the cards available when started. Cards becoming due later appear in a subsequent session.
- Text edits preserve scheduling state and increment the card version, invalidating stale open reviews.
- Deleting a deck deletes its cards. Existing review events keep a nullable card reference so daily activity and introduction counts remain accurate. Account deletion policy is still pending.
- A timezone change recalculates the current local day from timestamps; switching zones can change today's displayed activity and remaining new-card allowance.
- Refreshing another device reloads saved material and scheduling state; it does not transfer the exact open session position.

These are initial implementation defaults, not claims that the owner individually approved every open product choice.

## Verification

- ESLint and TypeScript
- Prisma schema validation and local client generation
- Unit tests for timezone boundaries, daylight-saving dates, queue ordering, global daily allowance, scheduling, input validation, review retries, stale versions, and history retention in preview mode
- Webpack production build
- In-browser preview check: create deck, create card, conceal/reveal answer, rate with keyboard, complete session, reload, and verify activity/card persistence

The cloud database migration was applied during subsequent sign-in troubleshooting (see below). Real Google browser authentication, database transactions, and cross-device cloud persistence have not been exercised end to end. The account UI stays unavailable until Google credentials are configured. These remain release gates, not completed tests.

OpenRouter now powers a notes-to-cards workflow with editable draft approval; see the enhancement below.

## Interface refinement: themes and sign-in

- All native dialogs explicitly center in the viewport, including after the CSS reset.
- Sign-in has a compact editorial layout and gently animated SVG linework; reduced motion disables decorative animation.
- Light, Dark, and System controls are available in the header and Preferences.
- Theme preference is stored per browser/device, initializes before content paints, and follows OS appearance when System is selected. It does not change account study preferences.
- The dark palette covers navigation, decks, editing dialogs, review cards, ratings, feedback, and sign-in.
- Google remains the implemented sign-in method. Email magic links are a recommended later alternative; email/password registration is not enabled.

During development sign-in troubleshooting, the initial migration was applied to the configured Neon database and the OAuth initiation endpoint returned the expected Google authorization URL. Full browser login and cross-device cloud behavior still require end-to-end verification.

## Mobile navigation and appearance motion

- Mobile header uses a compact Recall home action, a single animated sun/moon theme toggle, and a Sync action. It remains visible while scrolling.
- The bottom navigation is a compact floating dock with safe-area spacing, a sliding selection surface, active icon feedback, and `aria-current` for the selected screen. Mobile header/dock surfaces use solid colors rather than backdrop blur to reduce rendering work.
- Switching mobile sections returns to the top of the new section. Desktop navigation retains its sidebar layout.
- Appearance preferences use a sliding Light/Dark/System selector. The compact toggle switches directly between light and dark; System remains selectable in Preferences.
- Theme changes use a short, scoped 180 ms color fade on existing surfaces. The previous page-snapshot/circular-mask transition was removed to reduce work on mobile devices. Reduced-motion users receive immediate changes.
- Rapid theme changes retarget the existing CSS fade and retain the latest choice without queuing page animations. Storage failures fall back to an in-memory preference.

## Compact mobile layout

- Mobile deck tiles use compact horizontal rows with a small color thumbnail instead of tall covers. The create-deck tile follows the same compact rhythm.
- The dock is 62 px high and the mobile header is 64 px plus safe-area insets. Content retains bottom space for dock access.
- Button labels stay on one line. Heading actions move into their own row when necessary; card toolbars and dialog actions stack at the narrowest breakpoint instead of compressing labels.
- The Today review action fills the available card width rather than sharing a narrow text column with decoration.
- Browser checks covered the narrow mobile Today and deck views, theme switching, and unbroken New deck/review labels. No physical low-end-device performance benchmark was run.

## Rich cards, deck identity, and component structure

- shadcn Select, Dropdown Menu, Dialog, and Button primitives retain the existing color system and layout. UI icon glyphs come from Lucide React; the restored Recall brand mark and decorative sign-in line artwork are dedicated SVGs.
- A lazy-loaded Tiptap editor supports formatting on both card sides. Preferences select Focus or Canvas. Existing rich content renders safely as React elements without raw HTML injection. Focus edits preserve question and answer images and unchanged formatting.
- Deck identity supports a Lucide icon and optional Cloudinary cover. Authenticated answer/cover uploads have server-side file validation, size bounds, and per-user hourly limits.
- Additive rich-content/media migration has been applied to the configured development database. Existing preview data defaults to Focus mode and the cards icon.
- Page copy comes from six local variants that rotate on full refresh. No AI requests are involved.
- The monolithic workspace was split into a controller hook, provider, navigation, pages, dialogs, editors, and review components.
- Verification: 29 unit tests, typecheck, ESLint, and Webpack production build. Browser preview checks covered rich card creation, saved authoring preference, and the icon dropdown inside an editing dialog.
- Cloudinary and OpenRouter provider connectivity has been verified with generated test content. The new notes-to-cards workflow is implemented; the authenticated browser flow remains to be exercised.

## Collection editor and AI drafting enhancement

- Restored the original stacked-note Recall logo in the sidebar, mobile header, startup, sign-in, and favicon; a standalone SVG is in `public/brand`. General flashcard icons use Lucide GalleryVerticalEnd.
- Deck editing offers a cover dropzone, file picker, editable icon badge, image replacement/removal, and accent choice. All image entry uses file uploads; there is no image URL field.
- Authoring modes are named Focus and Canvas. The persisted `simple`/`rich` values stay compatible with existing accounts and preview storage.
- shadcn Sonner handles save notices; errors keep inline recovery. shadcn Card/Chart shows seven days of real reviews in the learner's timezone. No sample activity is fabricated. Charts have no bar animation and load separately.
- shadcn Tabs switch between the card list and a lazy table view with search, sorting, pagination, and edit/delete actions. Attachment filenames use a Badge; draft selection uses Checkbox.
- AI drafting sends supplied notes to OpenRouter, validates structured output, allows editing/selection, and saves only after explicit approval. Authentication, ownership, bounded input/output, a per-user rolling quota, and stable batch IDs protect the flow. Original notes remain accessible on saved AI cards.
- The additive AI request/source migration has been applied to development Neon. OpenRouter returned three validated drafts from sample study notes in a live provider check. Cloudinary accepted a generated PNG, which was then removed. Full signed-in browser generation/upload flows remain to be exercised. Unit tests also use fixed response fixtures.

## Flat editor layout and account loading repair

- Removed the cover gradient and decorative gradient mask. Cover, upload guidance, and icon selection use separate rows with normal spacing; no negative margins or floating edit badge overlap them.
- Both question and answer have an Add image file-upload button in Focus and Canvas. The always-visible URL input was removed from the rich editor. Question attachments use the same authenticated Cloudinary checks as answers. A question still needs a text prompt.
- Focus-mode text changes preserve image attachments on either side. Validation and preview persistence tests cover question images and attachment preservation.
- The development logs showed a Prisma validation failure after schema regeneration. The database singleton now tracks the generated client constructor and replaces stale instances; Better Auth rebuilds its adapter when that instance changes. Read-only account preference/deck/card/source/review queries passed against Neon.
- Account startup can retry loading through the API or start a fresh Google sign-in. OAuth failures return to the app with recovery guidance; state verification remains enabled. A separate expired/reused OAuth state was visible in logs. Fresh sign-in initiation reached the official Google login screen in the browser. Completing Google credentials and verifying the callback still requires the owner to finish that login.

## Deferred uploads, practice images, and top-of-page activity

- Moved the weekly chart directly below the Today page heading.
- Deck covers retain a visible selected icon; sidebar deck entries use their icons too.
- Image selection now creates a local object-URL preview. The final Save action validates, uploads referenced files, then persists resolved URLs. Cancel and removed images never upload. Successful uploads are reused after a failed save, and drafts remain editable for retry.
- Both card image actions are compact icon buttons in the toolbar. Focus also uses a compact image toolbar.
- Save reads the current rich editor document directly. Question and answer image nodes survive serialization and queue selection, and the practice card eagerly loads its visible images. Answers remain concealed until reveal.
- Added regression tests for local staging, validation before upload, removed selections, failures/retries, round-trip card persistence, practice render/reveal, updated image references, and icons on covers. All 36 tests pass; production build and static checks pass.
- A read-only diagnostic found no stored image nodes on the existing account card. An image that was never saved as part of a document must be attached again; there is no reliable source reference to recover automatically.

- Card/deck editors keep Save visible in a separate footer while fields scroll above it.

### Anytime review and installation (18 October 2026)

Added review selection as a lazy shadcn Sheet, with independently recorded free practice that leaves FSRS and new-card allowance unchanged. Migration `202610180001_practice_reviews` adds a defaulted review mode; it was deployed to the configured database and Prisma Client regenerated. Existing event data remains scheduled.

Added the App Router manifest, brand-derived PNG/maskable/Apple icons, production worker registration, public offline fallback, Preferences installation instructions, connectivity status, and explicit update handling. No account HTML/API data enters Cache Storage. Offline cloud review is outside this implementation.

Validation: 41 unit/regression tests cover schedule invariants, retry/mode collisions, selection/filtering, PNG sizes, manifest fields, service-worker network fallback and private-request exclusions. Browser preview verified search → one-card practice → successful rating/completion. Production compilation, lint and type checking pass. Physical iPhone/Mac installation and full authenticated browser sessions remain manual release checks.

The install action is always visible near the top of Preferences, even when `beforeinstallprompt` is unsupported, delayed, or dismissed. A native prompt is used when available; otherwise a shadcn dialog explains Safari home-screen/Dock and Chromium installation. Failed prompts fall back to the same guidance. Installation events clear the consumed prompt and show installed state for the current visit. A server-rendered regression test guards against hiding the button before an install event.

Native installation is invoked directly from the button only when a real browser install event is available; installation always requires browser confirmation. Safari exposes no programmatic PWA install prompt. The fallback now shows only the current platform's steps (including iPad desktop user agents), with explicit Safari menu instructions. Manifest app name is Recall. Replaced the scaffold favicon.ico with 16/32/48px brand assets, matching the existing SVG favicon and home-screen icons.

### Mobile dock and shadcn review surfaces

The mobile dock rests against the bottom safe area. A full-width translucent layer covers the dock margins and home-indicator region, intercepting pointer input so page content cannot be tapped through that space; content retains bottom scroll clearance.

The review picker and full-screen study session use shadcn Sheets with open/close presence retained until the exit animation finishes. Added the missing `tw-animate-css` import that activates shadcn's fade and slide classes, with 250ms entrance, 200ms exit, and reduced-motion overrides. The review session uses shadcn Card, Badge, Button, Progress, and ScrollArea. Focus returns to the initiating control where available; Escape respects pending saves. Progress exposes an accessible value and card-count description.

Verified in the browser at 390×844 and 360×640: bottom-edge hit testing resolves to the dock shield, the dock reaches the viewport bottom, the picker reports the active entrance animation, keyboard Space/1–4 still works, one-card free practice saves and reaches 100%, and Escape closes the session with focus restoration. All 44 existing regression tests pass, including rich card images and unchanged scheduling behavior.
