# Product

## Purpose

Open Recall, practice retrieval, and know what to review next. Start with a responsive web app for Mac and iPhone browsers. React Native is a later phase.

## Initial scope

- Google sign-in and private accounts across devices
- Create, rename, and delete decks
- Create, edit, and delete question/answer cards in Focus or Canvas mode
- Rich formatting for both sides, answer images, and deck covers or Lucide icons
- Study one card at a time; attempt an answer before revealing it
- Rate recall with Again, Hard, Good, or Easy
- FSRS scheduling and persistent review history
- Today screen with due cards, new cards, and a start-review action
- Session completion summary
- Daily new-card limit and user timezone
- Keyboard controls and accessible touch targets

The non-AI core must work independently of an AI provider.

## AI direction

OpenRouter powers notes-to-cards drafting. Users supply notes, request up to five drafts, edit and select them, then explicitly save. The deployment model remains configurable. Manual studying does not make AI requests.

Notes to editable drafts is implemented. Future candidates include card improvement, explanations after recall attempts, and source summarization.

## Visual direction

Proposed theme: a quiet study desk. Warm ivory, charcoal text, a muted indigo accent, generous spacing, and readable typography.

Support Light, Dark, and System themes, with the appearance preference saved on each device. The dark palette uses warm charcoal surfaces and muted lavender accents.

Use short CSS animations for reveal, transitions, button feedback, and progress. Respect reduced-motion preferences. Avoid animation delays in the review loop.

## Deferred scope

Offline review and conflict reconciliation, native apps, public decks, collaboration, payments, general file uploads, streak systems, and advanced analytics.

## First end-to-end milestone

Create a deck on Mac, study it on iPhone, and return to Mac with persisted progress and correct next review dates.
