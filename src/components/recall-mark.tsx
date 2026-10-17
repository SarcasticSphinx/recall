import type { SVGProps } from "react";
/** Recall's original stacked-note mark. This is a brand asset, not a UI glyph. */
export function RecallMark({
  size = 24,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="7" y="4" width="13" height="16" rx="3" />
      <path d="M4 7v10a3 3 0 0 0 3 3M11 9h5m-5 4h4" />
    </svg>
  );
}
