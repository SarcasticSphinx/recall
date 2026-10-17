export function installGuide({
  userAgent = "",
  platform = "",
  maxTouchPoints = 0,
}: { userAgent?: string; platform?: string; maxTouchPoints?: number } = {}) {
  if (
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1)
  ) {
    return {
      title: "Add Recall to your Home Screen",
      description:
        "On iPhone and iPad, installation starts from Safari’s Share menu.",
      steps: [
        "Open Recall in Safari.",
        "Tap Share, then Add to Home Screen (you may need to scroll).",
        "Keep Open as Web App enabled if shown, then tap Add.",
      ],
    };
  }
  if (
    /Mac/i.test(platform || userAgent) &&
    /Safari/i.test(userAgent) &&
    !/Chrome|Chromium|Edg|OPR/i.test(userAgent)
  ) {
    return {
      title: "Add Recall to your Dock",
      description:
        "Safari requires you to start installation from its menu. Websites can’t open this system dialog.",
      steps: [
        "In Safari, choose File → Add to Dock (macOS Sonoma or later).",
        "Confirm the name Recall and click Add.",
        "Open Recall from your Dock to use it in its own app window.",
      ],
    };
  }
  if (/Android/i.test(userAgent)) {
    return {
      title: "Install Recall on Android",
      description:
        "If the native prompt isn’t available, use your browser’s install menu.",
      steps: [
        "Open Recall in Chrome or Edge.",
        "Tap the browser menu → Install app or Add to Home screen.",
        "Confirm Install or Add in the system dialog.",
      ],
    };
  }
  return {
    title: "Install Recall on this device",
    description:
      "Your browser hasn’t offered an install prompt. It may already be installed, or installation may require the browser menu.",
    steps: [
      "Open Recall in Chrome or Edge, outside an in-app browser.",
      "Use the install icon in the address bar, or the browser menu → Install Recall / Install app.",
      "Confirm Install. If you already installed Recall, open it from your app launcher.",
    ],
  };
}
