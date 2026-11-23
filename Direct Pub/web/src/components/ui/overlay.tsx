"use client";
import * as RDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Dialog = RDialog.Root;
export const DialogTrigger = RDialog.Trigger;
export const DialogClose = RDialog.Close;

const overlay = "fixed inset-0 z-40 bg-text/30";

/** Fenêtre modale centrée. size : sm 400, md 560, lg 880 px. */
export function DialogContent({
  title, description, size = "md", children, footer,
}: { title: string; description?: string; size?: "sm" | "md" | "lg"; children?: React.ReactNode; footer?: React.ReactNode }) {
  const w = { sm: "max-w-(--size-modal-sm)", md: "max-w-(--size-modal-md)", lg: "max-w-(--size-modal-lg)" }[size];
  return (
    <RDialog.Portal>
      <RDialog.Overlay className={overlay} />
      <RDialog.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col",
          "rounded-lg border border-border bg-surface-raised shadow-pop",
          w,
        )}
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
          <div>
            <RDialog.Title className="text-lg">{title}</RDialog.Title>
            {description ? (
              <RDialog.Description className="mt-1 text-sm text-text-muted">{description}</RDialog.Description>
            ) : (
              <RDialog.Description className="sr-only">{title}</RDialog.Description>
            )}
          </div>
          <RDialog.Close className="rounded-sm p-1 text-text-muted hover:bg-surface hover:text-text" aria-label="Fermer">
            <X className="size-4" />
          </RDialog.Close>
        </header>
        <div className="overflow-y-auto px-6 pb-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-border px-6 py-3">{footer}</footer>}
      </RDialog.Content>
    </RDialog.Portal>
  );
}

/** Panneau latéral droit (notes, filtres). Largeur 480 px. */
export function DrawerContent({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <RDialog.Portal>
      <RDialog.Overlay className={overlay} />
      <RDialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-(--size-drawer) flex-col border-l border-border bg-surface-raised shadow-pop">
        <header className="flex h-(--size-header) items-center justify-between border-b border-border px-5">
          <RDialog.Title className="text-md">{title}</RDialog.Title>
          <RDialog.Description className="sr-only">{title}</RDialog.Description>
          <RDialog.Close className="rounded-sm p-1 text-text-muted hover:bg-surface hover:text-text" aria-label="Fermer">
            <X className="size-4" />
          </RDialog.Close>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </RDialog.Content>
    </RDialog.Portal>
  );
}
