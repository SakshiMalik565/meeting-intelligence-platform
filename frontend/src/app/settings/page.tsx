"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function SettingsPlaceholder() {
  const sections = ["Integrations", "Team Management", "Notifications", "Security & Audit"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {sections.map((section) => (
          <div
            key={section}
            className="p-6 bg-brand-surface border border-brand-border rounded-xl shadow-sm"
          >
            <h3 className="text-base font-bold text-brand-text-primary mb-2">
              {section}
            </h3>
            <p className="text-sm text-brand-text-muted">
              Configure {section.toLowerCase()} parameters. Section status: Coming soon placeholder.
            </p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
