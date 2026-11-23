"use client";
import * as RSwitch from "@radix-ui/react-switch";
import { useId } from "react";

export function Switch({ label, hint, ...props }: RSwitch.SwitchProps & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-xs text-text-muted">{hint}</span>}
      </label>
      <RSwitch.Root
        id={id}
        className="relative h-5 w-9 shrink-0 rounded-pill border border-border-input bg-surface transition-colors duration-fast data-[state=checked]:border-accent data-[state=checked]:bg-accent disabled:opacity-45"
        {...props}
      >
        <RSwitch.Thumb className="block size-3.5 translate-x-0.5 rounded-pill bg-text-muted shadow-card transition-transform duration-fast ease-dp data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-on-accent" />
      </RSwitch.Root>
    </div>
  );
}
