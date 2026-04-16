import { APP_MONOGRAM, APP_NAME, APP_TAGLINE } from "@/lib/branding";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  nameClassName?: string;
  subtitleClassName?: string;
  subtitle?: string | null;
  variant?: "horizontal" | "stacked" | "mark";
};

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      aria-hidden="true"
      className={cn("size-16 shrink-0", className)}
      fill="none"
    >
      <rect
        x="13"
        y="21"
        width="62"
        height="58"
        rx="10"
        stroke="var(--logo-primary)"
        strokeWidth="7"
      />
      <path
        d="M13 35H75"
        stroke="var(--logo-primary)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M29 14V27"
        stroke="var(--logo-accent)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M57 14V27"
        stroke="var(--logo-accent)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M28 35V79"
        stroke="var(--logo-primary)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M48 35V79"
        stroke="var(--logo-primary)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M13 54H48"
        stroke="var(--logo-primary)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M13 72H48"
        stroke="var(--logo-primary)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M54 58L65 70L86 42"
        stroke="var(--logo-accent)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLogo({
  className,
  markClassName,
  nameClassName,
  subtitleClassName,
  subtitle = APP_TAGLINE,
  variant = "horizontal",
}: BrandLogoProps) {
  const showText = variant !== "mark";

  return (
    <div
      className={cn(
        "inline-flex text-[#14387a] [--logo-primary:#14387a] [--logo-accent:#12bfb1] dark:text-slate-50 dark:[--logo-primary:#dce9ff] dark:[--logo-accent:#49e2d3]",
        variant === "stacked"
          ? "flex-col items-center text-center"
          : "items-center gap-3",
        className,
      )}
      title={APP_NAME}
    >
      <LogoMark
        className={cn(
          variant === "mark" && "size-10",
          variant === "horizontal" && "size-14",
          variant === "stacked" && "size-28 sm:size-32",
          markClassName,
        )}
      />
      {showText ? (
        <div
          className={cn(
            "flex min-w-0 flex-col",
            variant === "stacked" ? "items-center gap-2" : "gap-0.5",
          )}
        >
          <span
            className={cn(
              "truncate font-black uppercase leading-none tracking-tight",
              variant === "horizontal" && "text-2xl",
              variant === "stacked" && "text-4xl sm:text-5xl",
              nameClassName,
            )}
          >
            {APP_NAME}
          </span>
          {subtitle ? (
            <span
              className={cn(
                "uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300",
                variant === "horizontal" && "text-[10px]",
                variant === "stacked" && "text-sm sm:text-base",
                subtitleClassName,
              )}
            >
              {subtitle}
            </span>
          ) : null}
        </div>
      ) : (
        <span className="sr-only">{APP_MONOGRAM}</span>
      )}
    </div>
  );
}
