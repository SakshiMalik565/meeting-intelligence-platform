import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "accent";
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "secondary", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
          {
            "bg-brand-accent/10 border-brand-accent/30 text-brand-accent":
              variant === "accent",
            "bg-brand-bg border-brand-border text-brand-text-secondary":
              variant === "secondary",
            "bg-brand-success/10 border-brand-success/20 text-brand-success":
              variant === "success",
            "bg-brand-warning/10 border-brand-warning/20 text-brand-warning":
              variant === "warning",
            "bg-brand-danger/10 border-brand-danger/20 text-brand-danger":
              variant === "danger",
            "bg-brand-accent text-white border-transparent":
              variant === "primary",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";
export const Pill = Badge; // Aliased as requested by spec
