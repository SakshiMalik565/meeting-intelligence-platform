import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg transition-colors cursor-pointer select-none active:scale-98 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100",
          {
            // Variants
            "bg-brand-accent text-brand-text-primary hover:bg-brand-accent-hover":
              variant === "primary",
            "bg-brand-surface border border-brand-border text-brand-text-primary hover:bg-brand-surface-hover":
              variant === "secondary",
            "text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-surface":
              variant === "ghost",
            "bg-brand-danger text-white hover:bg-red-600":
              variant === "danger",
            // Sizes
            "px-3 py-1.5 text-xs": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-5 py-2.5 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
