"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function SearchPlaceholder() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center p-16 bg-brand-surface border border-brand-border rounded-xl text-center shadow-sm">
        <h2 className="text-lg font-bold text-brand-text-primary mb-2">
          Global Search Command Palette
        </h2>
        <p className="text-sm text-brand-text-secondary max-w-sm">
          Use the Command Palette shortcut (Cmd+K) or global search triggers here. Coming soon in Phase 7!
        </p>
      </div>
    </DashboardLayout>
  );
}
