import * as React from "react";
import { cn } from "@/lib/utils";

// ── Input ───────────────────────────────────────────────────────────

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text-primary placeholder-brand-text-muted transition-colors focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// ── Textarea ────────────────────────────────────────────────────────

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-20 w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text-primary placeholder-brand-text-muted transition-colors focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20 disabled:cursor-not-allowed disabled:opacity-50 resize-y",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

// ── Select ──────────────────────────────────────────────────────────

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text-primary transition-colors focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";
