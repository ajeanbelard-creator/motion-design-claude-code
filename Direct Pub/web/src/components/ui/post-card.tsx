import { MessageSquareText } from "lucide-react";
import { type Network, type PostStatus } from "@/lib/networks";
import { cn } from "@/lib/cn";
import { NetworkMark, statusDot, statusLabel } from "./badges";

export interface PostCardProps {
  time: string;
  text: string;
  networks: Network[];
  status: PostStatus;
  type?: string;
  hasUnreadNotes?: boolean;
  density?: "condensed" | "normal" | "expanded";
  draggable?: boolean;
}

/** Carte d'un post dans le calendrier. La bordure gauche porte le statut, le libellé le répète. */
export function PostCard({ time, text, networks, status, type, hasUnreadNotes, density = "normal", draggable }: PostCardProps) {
  return (
    <button
      type="button"
      aria-label={`${time}, ${statusLabel(status)}, ${text}`}
      className={cn(
        "group relative flex w-full flex-col gap-1 overflow-hidden rounded-md border border-border bg-surface-raised pl-3 text-left",
        "transition-shadow duration-fast hover:shadow-card",
        density === "condensed" ? "py-1 pr-2" : density === "expanded" ? "py-3 pr-3" : "py-2 pr-2.5",
        draggable && "cursor-grab active:cursor-grabbing",
      )}
    >
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-[3px]", statusDot(status))} />
      <span className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-text-muted tabular-nums">{time}</span>
        <span className="flex items-center gap-1">
          {hasUnreadNotes && <MessageSquareText aria-label="Notes non lues" className="size-3.5 text-status-scheduled" />}
          {type && <span className="text-xs text-text-muted">{type}</span>}
        </span>
      </span>
      {density !== "condensed" && (
        <span className={cn("text-sm text-text", density === "expanded" ? "line-clamp-4" : "line-clamp-2")}>{text}</span>
      )}
      <span className="flex items-center gap-1">
        {networks.map((n) => <NetworkMark key={n} network={n} size="sm" muted />)}
        <span className="ml-auto text-xs text-text-muted">{statusLabel(status)}</span>
      </span>
    </button>
  );
}
