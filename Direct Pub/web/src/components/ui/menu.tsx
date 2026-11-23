"use client";
import * as RMenu from "@radix-ui/react-dropdown-menu";
import * as RTooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";

export const Menu = RMenu.Root;
export const MenuTrigger = RMenu.Trigger;

export function MenuContent({ children, align = "end" }: { children: React.ReactNode; align?: "start" | "end" }) {
  return (
    <RMenu.Portal>
      <RMenu.Content
        align={align}
        sideOffset={6}
        className="z-50 min-w-48 rounded-md border border-border bg-surface-raised p-1 shadow-pop"
      >
        {children}
      </RMenu.Content>
    </RMenu.Portal>
  );
}

export function MenuItem({
  children, danger, icon, ...props
}: RMenu.DropdownMenuItemProps & { danger?: boolean; icon?: React.ReactNode }) {
  return (
    <RMenu.Item
      className={cn(
        "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none",
        "data-[highlighted]:bg-surface data-[disabled]:opacity-45",
        danger && "text-danger",
      )}
      {...props}
    >
      {icon}
      {children}
    </RMenu.Item>
  );
}

export const MenuSeparator = () => <RMenu.Separator className="my-1 h-px bg-border" />;

export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <RTooltip.Provider delayDuration={300}>
      <RTooltip.Root>
        <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
        <RTooltip.Portal>
          <RTooltip.Content sideOffset={6} className="z-50 rounded-sm bg-accent px-2 py-1 text-xs text-on-accent">
            {label}
          </RTooltip.Content>
        </RTooltip.Portal>
      </RTooltip.Root>
    </RTooltip.Provider>
  );
}
