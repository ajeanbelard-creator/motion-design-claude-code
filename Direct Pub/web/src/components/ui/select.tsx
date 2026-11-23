"use client";
import * as RSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { useId } from "react";

export function Select({
  label, options, placeholder = "Choisir", ...props
}: RSelect.SelectProps & { label: string; options: { value: string; label: string }[]; placeholder?: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <RSelect.Root {...props}>
        <RSelect.Trigger
          id={id}
          className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border-input bg-bg px-3 text-base hover:border-text-muted data-[placeholder]:text-text-muted"
        >
          <RSelect.Value placeholder={placeholder} />
          <RSelect.Icon><ChevronDown className="size-4 text-text-muted" /></RSelect.Icon>
        </RSelect.Trigger>
        <RSelect.Portal>
          <RSelect.Content position="popper" sideOffset={6}
            className="z-50 max-h-72 min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-border bg-surface-raised p-1 shadow-pop">
            <RSelect.Viewport>
              {options.map((o) => (
                <RSelect.Item key={o.value} value={o.value}
                  className="flex cursor-default items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[highlighted]:bg-surface">
                  <RSelect.ItemText>{o.label}</RSelect.ItemText>
                  <RSelect.ItemIndicator><Check className="size-4" /></RSelect.ItemIndicator>
                </RSelect.Item>
              ))}
            </RSelect.Viewport>
          </RSelect.Content>
        </RSelect.Portal>
      </RSelect.Root>
    </div>
  );
}
