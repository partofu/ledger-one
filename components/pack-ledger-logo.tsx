import { cn } from "@/lib/utils"

interface PackLedgerLogoProps {
  className?: string
  /** Use "icon" for just the icon mark, "full" for icon + text */
  variant?: "icon" | "full"
  /** Text size class — only applies when variant is "full" */
  textClassName?: string
}

/**
 * Unified PackLedger logo — matches the favicon (orange rounded-square with a 3D box).
 * Use `variant="icon"` for the standalone mark, or `variant="full"` for icon + "PackLedger" text.
 */
export function PackLedgerLogo({
  className,
  variant = "icon",
  textClassName,
}: PackLedgerLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        fill="none"
        className="shrink-0"
        width="1em"
        height="1em"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill="#f97316" />
        <path
          d="M8 12l8-5 8 5v10l-8 5-8-5V12z"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinejoin="round"
        />
        <path
          d="M16 7v10"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M8 12l8 5 8-5"
          stroke="white"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      {variant === "full" && (
        <span className={cn("font-bold", textClassName)}>LedgerOne</span>
      )}
    </span>
  )
}
