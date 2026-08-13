"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Unhandled Application Exception:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-16 h-16 rounded-full bg-brand-danger/10 border border-brand-danger/30 text-brand-danger flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-2">
        Something went wrong!
      </h1>

      <p className="text-sm text-brand-text-secondary max-w-md mb-6 leading-relaxed">
        An unexpected application error occurred. We have logged the error details. Please try refreshing the page or returning to the dashboard.
      </p>

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          onClick={() => reset()}
          className="flex items-center gap-2 text-xs"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>

        <Link href="/">
          <Button variant="primary" className="flex items-center gap-2 text-xs">
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
