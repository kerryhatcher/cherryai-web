import { cn } from "@/lib/utils";

interface CherryMarkProps {
  className?: string;
  /** Animate a gentle idle bob — used on the hero mark. */
  bob?: boolean;
}

/**
 * The CherryAI brand glyph: a pair of cherries on a stem with a single leaf.
 * The fruit inherits `currentColor`; stem and leaf are drawn at reduced
 * opacity so the mark reads well from a 16px avatar up to a 96px hero.
 */
export function CherryMark({ className, bob }: CherryMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn(className, bob && "motion-safe:[animation:cherry-bob_4.5s_ease-in-out_infinite]")}
      style={{ transformOrigin: "16px 8px" }}
    >
      {/* stems meeting at the top */}
      <path
        d="M17 6C13.6 10 10.8 13.4 9.4 18.2M17 6c1.6 3.1 3.9 5.2 6.4 7.2"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      {/* leaf */}
      <path
        d="M17 6c2.7-2.3 5.6-2.2 7-1.6-.1 2.2-2 4.3-4.6 4.5C17.7 8.6 16.9 7.2 17 6Z"
        fill="currentColor"
        fillOpacity="0.32"
      />
      {/* cherries */}
      <circle cx="9" cy="22.4" r="5.4" fill="currentColor" />
      <circle cx="21" cy="23.4" r="4.9" fill="currentColor" />
      {/* specular highlights */}
      <circle cx="7" cy="20.4" r="1.3" fill="#fff" fillOpacity="0.4" />
      <circle cx="19.2" cy="21.7" r="1.05" fill="#fff" fillOpacity="0.34" />
    </svg>
  );
}
