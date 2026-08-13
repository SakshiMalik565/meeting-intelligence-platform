"use client";

import * as React from "react";
import {
  Video,
  Calendar,
  Users,
  Bell,
  ShieldCheck,
  Zap,
  Lock,
  Database,
  ExternalLink,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="border-b border-brand-border pb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-brand-text-primary tracking-tight">
            Account & System Settings
          </h1>
          <p className="text-xs text-brand-text-secondary mt-1">
            Manage your workspace integrations, team permissions, notification preferences, and security policies.
          </p>
        </div>

        {/* Section 1: User Identity & Authentication (Active Single Tenant) */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-brand-accent" />
              <h2 className="text-sm font-bold text-brand-text-primary">
                Current User Identity & Single-Tenant Authentication
              </h2>
            </div>
            <Badge variant="success" className="text-[10px]">
              Active Session
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-bg/50 p-4 rounded-xl border border-brand-border">
            <div className="flex items-center gap-3">
              <Avatar name="Sakshi Malik" size="md" />
              <div>
                <h3 className="text-sm font-bold text-brand-text-primary">
                  Sakshi Malik
                </h3>
                <p className="text-xs text-brand-text-muted">
                  sakshi@meetingintel.com • Workspace Owner / Lead Engineer
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-[10px]">
                ID: 550e8400...0000
              </Badge>
            </div>
          </div>
          <p className="text-xs text-brand-text-muted">
            The platform is running in single-tenant mode seeded with Sakshi Malik&apos;s identity. OAuth2 / SSO integration is reserved for multi-tenant deployments.
          </p>
        </Card>

        {/* Section 2: Integrations (Placeholder / Disabled Cards) */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-brand-accent" />
              <h2 className="text-sm font-bold text-brand-text-primary">
                Meeting & CRM Integrations
              </h2>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              Coming Soon
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Zoom */}
            <div className="p-4 bg-brand-bg/40 border border-brand-border rounded-xl flex items-start justify-between opacity-75">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-brand-text-primary flex items-center gap-1.5">
                    Zoom Video Communications
                  </h3>
                  <p className="text-[11px] text-brand-text-muted mt-1 leading-snug">
                    Automatically ingest Zoom Cloud Recordings and live meeting audio feeds.
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" disabled className="text-[11px] h-7 px-2">
                Connect
              </Button>
            </div>

            {/* Google Meet */}
            <div className="p-4 bg-brand-bg/40 border border-brand-border rounded-xl flex items-start justify-between opacity-75">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-brand-text-primary">
                    Google Meet & Workspace
                  </h3>
                  <p className="text-[11px] text-brand-text-muted mt-1 leading-snug">
                    Auto-join Google Calendar invites with Antigravity AI bot assistant.
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" disabled className="text-[11px] h-7 px-2">
                Connect
              </Button>
            </div>

            {/* Calendar */}
            <div className="p-4 bg-brand-bg/40 border border-brand-border rounded-xl flex items-start justify-between opacity-75">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-brand-text-primary">
                    Calendar Synchronization
                  </h3>
                  <p className="text-[11px] text-brand-text-muted mt-1 leading-snug">
                    Sync upcoming meetings from Outlook and Google Calendar in real time.
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" disabled className="text-[11px] h-7 px-2">
                Connect
              </Button>
            </div>

            {/* HubSpot & Salesforce */}
            <div className="p-4 bg-brand-bg/40 border border-brand-border rounded-xl flex items-start justify-between opacity-75">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-brand-text-primary">
                    HubSpot & Salesforce CRM
                  </h3>
                  <p className="text-[11px] text-brand-text-muted mt-1 leading-snug">
                    Push generated action items and summary notes directly to Deal timelines.
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" disabled className="text-[11px] h-7 px-2">
                Connect
              </Button>
            </div>
          </div>
        </Card>

        {/* Section 3: Team Management & Sharing */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-brand-accent" />
              <h2 className="text-sm font-bold text-brand-text-primary">
                Team Workspace & Access Control
              </h2>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              Single-User Tier
            </Badge>
          </div>

          <p className="text-xs text-brand-text-secondary leading-relaxed">
            Role-based access control (RBAC), team workspaces, and invite links are enabled for Organization plans.
          </p>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled className="text-xs">
              Invite Team Member
            </Button>
            <Button variant="ghost" size="sm" disabled className="text-xs">
              Manage Roles
            </Button>
          </div>
        </Card>

        {/* Section 4: Notifications & Webhooks */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-brand-accent" />
              <h2 className="text-sm font-bold text-brand-text-primary">
                Notifications & Slack Webhooks
              </h2>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              Disabled
            </Badge>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-brand-bg/40 rounded-xl border border-brand-border cursor-not-allowed opacity-75">
              <div>
                <p className="text-xs font-semibold text-brand-text-primary">
                  Email Summary Recaps
                </p>
                <p className="text-[11px] text-brand-text-muted">
                  Send meeting summary notes to all participants immediately after processing.
                </p>
              </div>
              <input type="checkbox" disabled checked className="rounded text-brand-accent" />
            </label>

            <label className="flex items-center justify-between p-3 bg-brand-bg/40 rounded-xl border border-brand-border cursor-not-allowed opacity-75">
              <div>
                <p className="text-xs font-semibold text-brand-text-primary">
                  Slack Channel Broadcasts
                </p>
                <p className="text-[11px] text-brand-text-muted">
                  Post key action items to designated team #general channels.
                </p>
              </div>
              <input type="checkbox" disabled className="rounded text-brand-accent" />
            </label>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
