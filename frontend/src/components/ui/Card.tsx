import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-brand-surface border border-brand-border rounded-xl p-5 shadow-sm transition-all",
          hoverable && "hover:bg-brand-surface-hover hover:border-brand-accent/30 hover:-translate-y-0.5",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
