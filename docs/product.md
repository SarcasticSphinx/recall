# Product

## Purpose

Open Recall, practice retrieval, and know what to review next. Start with a responsive web app for Mac and iPhone browsers. React Native is a later phase.

## Initial scope

- Google sign-in and private accounts across devices
- Create, rename, and delete decks
- Create, edit, and delete plain-text question/answer cards
- Study one card at a time; attempt an answer before revealing it
- Rate recall with Again, Hard, Good, or Easy
- FSRS scheduling and persistent review history
- Today screen with due cards, new cards, and a start-review action
- Session completion summary
- Daily new-card limit and user timezone
- Keyboard controls and accessible touch targets

The non-AI core must work independently of an AI provider.

## AI direction

AI integration is important. The first feature, provider, model, and release timing have not been finalized. The owner has OpenAI credits and may consider other models later; account eligibility and balance have not been verified.

Candidates: notes to editable flashcard drafts (recommended first experiment), card improvement, explanations after recall attempts, and source summarization. These are candidates, not committed MVP features. Users should edit and approve generated cards before saving them.

## Visual direction

Proposed theme: a quiet study desk. Warm ivory, charcoal text, a muted indigo accent, generous spacing, and readable typography.

Support Light, Dark, and System themes, with the appearance preference saved on each device. The dark palette uses warm charcoal surfaces and muted lavender accents.

Use short CSS animations for reveal, transitions, button feedback, and progress. Respect reduced-motion preferences. Avoid animation delays in the review loop.

## Deferred scope

Offline review and conflict reconciliation, native apps, public decks, collaboration, payments, rich text, uploads, streak systems, and advanced analytics.

## First end-to-end milestone

Create a deck on Mac, study it on iPhone, and return to Mac with persisted progress and correct next review dates.
