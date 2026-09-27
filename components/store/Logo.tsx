import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-8 w-8", className)} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#f2eee6" />
      <path d="M14 40c6 0 10-3 14-8l6-8c3-4 7-6 12-6h4v6h-4c-3 0-5 1-7 4l-6 8c-5 7-11 10-19 10h-4v-6z" fill="#0b0b0c" />
      <rect x="12" y="46" width="40" height="5" rx="2.5" fill="#0b0b0c" />
    </svg>
  );
}

export default function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-8 w-8 transition-transform duration-500 group-hover:-rotate-12" />
      {!compact && (
        <span className="display text-[1.35rem] leading-none tracking-wide">
          Soles<span className="text-volt">/</span>in Motion
        </span>
      )}
    </span>
  );
}
