import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-md border border-border-input bg-bg px-3 text-base text-text placeholder:text-text-muted " +
  "transition-colors duration-fast ease-dp hover:border-text-muted " +
  "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus " +
  "disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60 " +
  "aria-[invalid=true]:border-danger";

export function Field({
  label, hint, error, children, id,
}: { label: string; hint?: string; error?: string; id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, ...props }, ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} id={fid}>
      <input
        ref={ref}
        id={fid}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
        className={cn(control, "h-9", className)}
        {...props}
      />
    </Field>
  );
});

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string; hint?: string; error?: string; maxChars?: number;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, maxChars, className, id, value, ...props }, ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  const count = typeof value === "string" ? [...value].length : 0;
  const over = maxChars !== undefined && count > maxChars;
  return (
    <Field label={label} hint={hint} error={error ?? (over ? `${count - maxChars!} caractères de trop` : undefined)} id={fid}>
      <div className="relative">
        <textarea
          ref={ref}
          id={fid}
          value={value}
          aria-invalid={error || over ? true : undefined}
          aria-describedby={`${fid}-count`}
          className={cn(control, "min-h-28 resize-y py-2 pb-7", className)}
          {...props}
        />
        {maxChars !== undefined && (
          <span
            id={`${fid}-count`}
            aria-live="polite"
            className={cn("absolute right-3 bottom-2 font-mono text-xs tabular-nums", over ? "text-danger" : "text-text-muted")}
          >
            {count} / {maxChars}
          </span>
        )}
      </div>
    </Field>
  );
});
