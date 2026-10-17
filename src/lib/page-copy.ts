export const pageCopy = {
  today: [
    [
      "A good day to remember.",
      "A few focused minutes. A little more that stays with you.",
    ],
    [
      "Give curiosity a moment.",
      "One small question can make something click.",
    ],
    ["Keep a little more.", "Return to what matters, one card at a time."],
    ["Make room for recall.", "A quiet moment of practice goes a long way."],
    ["See what comes back.", "You know more than you think. Let's find out."],
    [
      "Little by little, it stays.",
      "No rush. Just a few ideas worth remembering.",
    ],
  ],
  decks: [
    [
      "Room for what you learn.",
      "Your ideas, organized into small moments of practice.",
    ],
    [
      "A home for your curiosity.",
      "Keep the questions you want to come back to.",
    ],
    ["Gather what matters.", "Small collections. A growing understanding."],
    ["Follow a new thread.", "Everything you're learning has a place here."],
    [
      "Your next discovery lives here.",
      "Turn a passing thought into lasting knowledge.",
    ],
    [
      "Ideas worth returning to.",
      "Build a little collection of things to remember.",
    ],
  ],
  settings: [
    [
      "A rhythm that works for you.",
      "Keep your practice small, steady, and personal.",
    ],
    [
      "Make a little space yours.",
      "Set the mood, find your pace, and keep learning.",
    ],
    [
      "Find your own rhythm.",
      "A few thoughtful choices for your daily practice.",
    ],
    [
      "Learning, on your terms.",
      "Choose the little details that help you focus.",
    ],
    [
      "Small adjustments. Better days.",
      "Make practice feel a little more like you.",
    ],
    [
      "Settle into your practice.",
      "Your space, your pace, your way of learning.",
    ],
  ],
  complete: [
    "That was time well spent.",
    "A little more that stays.",
    "One step further today.",
    "Give your mind a moment.",
    "You showed up. That counts.",
    "Small practice, real progress.",
  ],
} as const;
export function getPageCopy(seed: number) {
  const index = Math.abs(Math.floor(seed)) % 6;
  return {
    today: pageCopy.today[index],
    decks: pageCopy.decks[index],
    settings: pageCopy.settings[index],
    complete: pageCopy.complete[index],
  };
}
