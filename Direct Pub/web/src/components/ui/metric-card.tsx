import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

const fmt = new Intl.NumberFormat("fr-FR");

/** Chiffre clé + variation par rapport à la période précédente de même durée. */
export function MetricCard({
  label, value, previous, suffix, selected, onToggle,
}: { label: string; value: number; previous?: number; suffix?: string; selected?: boolean; onToggle?: () => void }) {
  const delta = previous === undefined || previous === 0 ? undefined : (value - previous) / previous;
  const up = delta !== undefined && delta >= 0;
  const Tag = onToggle ? "button" : "div";
  return (
    <Tag
      {...(onToggle ? { type: "button", onClick: onToggle, "aria-pressed": selected } : {})}
      className={cn(
        "flex min-w-40 flex-col gap-1 rounded-lg border bg-surface-raised p-4 text-left",
        selected === false ? "border-border opacity-60" : "border-border",
        onToggle && "hover:border-text-muted",
      )}
    >
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-xl tabular-nums">{fmt.format(value)}{suffix}</span>
      {delta === undefined ? (
        <span className="text-xs text-text-muted">Pas de période à comparer</span>
      ) : (
        <span
          className={cn("inline-flex items-center gap-0.5 text-xs tabular-nums", up ? "text-success" : "text-danger")}
          title={`${up ? "+" : ""}${fmt.format(value - previous!)} par rapport à la période précédente`}
        >
          {up ? <ArrowUpRight aria-hidden className="size-3.5" /> : <ArrowDownRight aria-hidden className="size-3.5" />}
          {up ? "+" : ""}{(delta * 100).toFixed(1).replace(".", ",")} %
          <span className="sr-only">{up ? "en hausse" : "en baisse"} par rapport à la période précédente</span>
        </span>
      )}
    </Tag>
  );
}
