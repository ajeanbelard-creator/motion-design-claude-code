import * as RAvatar from "@radix-ui/react-avatar";
import { cn } from "@/lib/cn";

export function EmptyState({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      {icon && <div className="text-text-muted">{icon}</div>}
      <div>
        <p className="text-md">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-text-muted">{text}</p>
      </div>
      {action}
    </div>
  );
}

export function Avatar({ name, src, size = 32 }: { name: string; src?: string; size?: number }) {
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <RAvatar.Root className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill bg-surface border border-border" style={{ width: size, height: size }}>
      {src && <RAvatar.Image src={src} alt={name} className="size-full object-cover" />}
      <RAvatar.Fallback className="text-xs font-medium text-text-muted">{initials}</RAvatar.Fallback>
    </RAvatar.Root>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-surface", className)} />;
}

export function Progress({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm"><span>{label}</span><span className="tabular-nums text-text-muted">{Math.round(v)} %</span></div>
      <div role="progressbar" aria-label={label} aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} className="h-1.5 overflow-hidden rounded-pill bg-surface">
        <div className="h-full rounded-pill bg-accent transition-[width] duration-base ease-dp" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function Toast({ tone = "info", children }: { tone?: "info" | "success" | "danger"; children: React.ReactNode }) {
  const tones = { info: "border-border", success: "border-success", danger: "border-danger" };
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex items-center gap-3 rounded-md border border-l-4 bg-surface-raised px-4 py-3 text-sm shadow-pop", tones[tone])}>
      {children}
    </div>
  );
}
