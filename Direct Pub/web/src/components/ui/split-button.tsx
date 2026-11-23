"use client";
import * as RMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Button, type ButtonProps } from "./button";
import { MenuContent } from "./menu";

/** Action principale + menu d'actions voisines (ex. Planifier ▾ : brouillon, publier maintenant). */
export function SplitButton({
  menuLabel, menu, ...props
}: ButtonProps & { menuLabel: string; menu: React.ReactNode }) {
  return (
    <div className="inline-flex">
      <Button {...props} className="rounded-r-none" />
      <RMenu.Root>
        <RMenu.Trigger asChild>
          <Button variant={props.variant} size={props.size === "icon" ? "md" : props.size} aria-label={menuLabel}
            disabled={props.disabled || props.loading}
            className="rounded-l-none border-l border-on-accent/25 px-2">
            <ChevronDown className="size-4" />
          </Button>
        </RMenu.Trigger>
        <MenuContent>{menu}</MenuContent>
      </RMenu.Root>
    </div>
  );
}
