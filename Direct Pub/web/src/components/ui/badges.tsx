import { NETWORKS, type Network, type PostStatus } from "@/lib/networks";
import { cn } from "@/lib/cn";

const STATUS: Record<PostStatus, { label: string; dot: string; text: string }> = {
  published: { label: "Publié", dot: "bg-status-published", text: "text-status-published" },
  scheduled: { label: "Planifié", dot: "bg-status-scheduled", text: "text-status-scheduled" },
  draft: { label: "Brouillon", dot: "bg-status-draft", text: "text-status-draft" },
  failed: { label: "En erreur", dot: "bg-status-failed", text: "text-status-failed" },
  autolist: { label: "Autoliste", dot: "bg-status-autolist", text: "text-status-autolist" },
  review: { label: "En validation", dot: "bg-status-review", text: "text-status-review" },
};

/** Statut d'un post : point de couleur + libellé (jamais la couleur seule). */
export function StatusBadge({ status, className }: { status: PostStatus; className?: string }) {
  const s = STATUS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", s.text, className)}>
      <span aria-hidden className={cn("size-1.5 rounded-pill", s.dot)} />
      {s.label}
    </span>
  );
}
export const statusDot = (status: PostStatus) => STATUS[status].dot;
export const statusLabel = (status: PostStatus) => STATUS[status].label;

/** Pastille de réseau : abréviation monochrome (aucun logo de marque). */
export function NetworkMark({ network, size = "md", muted }: { network: Network; size?: "sm" | "md"; muted?: boolean }) {
  const n = NETWORKS[network];
  return (
    <span
      title={n.label}
      aria-label={n.label}
      role="img"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm border font-mono font-medium tracking-tight",
        size === "sm" ? "size-5 text-[10px]" : "size-6 text-[11px]",
        muted ? "border-border text-text-muted" : "border-text bg-accent text-on-accent",
      )}
    >
      {n.short}
    </span>
  );
}

export function Tag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  const tones = {
    neutral: "bg-surface text-text-muted border-border",
    success: "bg-success-soft text-success border-transparent",
    warning: "bg-warning-soft text-warning border-transparent",
    danger: "bg-danger-soft text-danger border-transparent",
    info: "bg-info-soft text-status-scheduled border-transparent",
  };
  return <span className={cn("inline-flex items-center rounded-pill border px-2 py-0.5 text-xs", tones[tone])}>{children}</span>;
}
