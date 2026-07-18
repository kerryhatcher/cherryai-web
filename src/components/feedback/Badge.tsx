import { cn } from "@/lib/utils";

interface BadgeProps {
  label: string;
  tone: string;
  className?: string;
}

export function Badge({ label, tone, className }: BadgeProps) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap", tone, className)}>
      {label}
    </span>
  );
}
