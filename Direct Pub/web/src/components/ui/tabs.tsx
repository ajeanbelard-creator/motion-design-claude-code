"use client";
import * as RTabs from "@radix-ui/react-tabs";

export const Tabs = RTabs.Root;
export const TabsContent = RTabs.Content;

export function TabsList({ items }: { items: { value: string; label: string; count?: number }[] }) {
  return (
    <RTabs.List className="flex gap-1 border-b border-border">
      {items.map((i) => (
        <RTabs.Trigger
          key={i.value}
          value={i.value}
          className="-mb-px flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-sm text-text-muted hover:text-text data-[state=active]:border-accent data-[state=active]:font-medium data-[state=active]:text-text"
        >
          {i.label}
          {i.count !== undefined && (
            <span className="rounded-pill bg-surface px-1.5 text-xs tabular-nums">{i.count}</span>
          )}
        </RTabs.Trigger>
      ))}
    </RTabs.List>
  );
}
