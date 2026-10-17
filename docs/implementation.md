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

AI has no provider calls or API-key usage in this slice. The UI labels AI as planned.

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
