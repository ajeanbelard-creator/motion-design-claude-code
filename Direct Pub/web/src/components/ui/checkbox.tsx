"use client";
import * as RCheckbox from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { useId } from "react";

export function Checkbox({ label, ...props }: RCheckbox.CheckboxProps & { label: string }) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <RCheckbox.Root
        id={id}
        className="flex size-4 items-center justify-center rounded-sm border border-border-input bg-bg data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=indeterminate]:border-accent data-[state=indeterminate]:bg-accent disabled:opacity-45"
        {...props}
      >
        <RCheckbox.Indicator className="text-on-accent">
          {props.checked === "indeterminate" ? <Minus className="size-3" /> : <Check className="size-3" strokeWidth={3} />}
        </RCheckbox.Indicator>
      </RCheckbox.Root>
      <label htmlFor={id} className="text-sm">{label}</label>
    </div>
  );
}
