import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, name, size = "md", ...props }, ref) => {
    // Generate initials fallback
    const initials = name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    // Determine colors deterministically based on character code sum
    const colors = [
      "bg-red-500/20 text-red-300 border-red-500/30",
      "bg-orange-500/20 text-orange-300 border-orange-500/30",
      "bg-amber-500/20 text-amber-300 border-amber-500/30",
      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      "bg-teal-500/20 text-teal-300 border-teal-500/30",
      "bg-blue-500/20 text-blue-300 border-blue-500/30",
      "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      "bg-violet-500/20 text-violet-300 border-violet-500/30",
      "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
      "bg-pink-500/20 text-pink-300 border-pink-500/30",
    ];
    const sum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorClass = colors[sum % colors.length];

    const sizeClasses = {
      xs: "w-6 h-6 text-[10px]",
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-12 h-12 text-base",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-full overflow-hidden border font-semibold select-none",
          colorClass,
          sizeClasses[size],
          className
        )}
        title={name}
        {...props}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // hide image on load error and fallback to initials
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : null}
        <span className="absolute">{initials || "?"}</span>
      </div>
    );
  }
);

Avatar.displayName = "Avatar";
