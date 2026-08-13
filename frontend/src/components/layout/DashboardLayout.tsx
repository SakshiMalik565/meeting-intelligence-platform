"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  FolderOpen,
  Search,
  Settings,
  Menu,
  X,
  Sparkles,
  Plus,
} from "lucide-react";
import { api } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CommandPalette } from "@/components/search/CommandPalette";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onNewMeetingClick?: () => void;
}

export function DashboardLayout({ children, onNewMeetingClick }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  // Fetch default logged-in user
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.getCurrentUser,
  });

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "My Meetings", href: "/", icon: FolderOpen },
    { name: "Global Search", href: "/search", icon: Search },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0d1017] border-r border-brand-border text-brand-text-secondary select-none">
      {/* Brand logo wordmark */}
      <div className="flex items-center gap-2 px-6 h-16 border-b border-brand-border shrink-0">
        <Sparkles className="w-6 h-6 text-brand-accent animate-pulse" />
        <span className="text-base font-bold text-brand-text-primary tracking-wide">
          Fireflies.ai <span className="text-[10px] bg-brand-accent/20 text-brand-accent px-1.5 py-0.5 rounded border border-brand-accent/30 font-normal uppercase">Clone</span>
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-brand-accent/10 text-brand-accent border-l-2 border-brand-accent pl-2.5"
                  : "hover:bg-brand-surface hover:text-brand-text-primary"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer User Info */}
      <div className="p-4 border-t border-brand-border bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <Avatar
            src={user?.avatar_url}
            name={user?.name || "User"}
            size="sm"
          />
          <div className="overflow-hidden min-w-0">
            <p className="text-sm font-medium text-brand-text-primary truncate">
              {user?.name || "Loading..."}
            </p>
            <p className="text-xs text-brand-text-muted truncate">
              {user?.email || "Retrieving info..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-brand-bg">
      {/* Desktop Sidebar (visible on desktop) */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-20">
        <SidebarContent />
      </div>

      {/* Mobile Drawer Backdrop overlay */}
      {mobileSidebarOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}

      {/* Mobile Sidebar Navigation Panel */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-brand-bg transition-transform duration-300 ease-in-out md:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile close button overlay */}
        <button
          className="absolute top-4 right-4 p-1 bg-brand-surface border border-brand-border rounded text-brand-text-secondary"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </div>

      {/* Main Content Area Container */}
      <div className="flex flex-col flex-1 md:pl-64 min-w-0">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-6 h-16 border-b border-brand-border bg-[#0d1017]/80 backdrop-blur-sm sticky top-0 z-10">
          {/* Left: Mobile hamburger menu trigger */}
          <div className="flex items-center gap-4">
            <button
              className="p-1 text-brand-text-secondary hover:text-brand-text-primary md:hidden"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-brand-text-primary hidden sm:block">
              {pathname === "/settings" ? "Settings" : pathname === "/search" ? "Global Search" : "My Meetings"}
            </h1>
          </div>

          {/* Right actions: New Meeting trigger + User Profile link */}
          <div className="flex items-center gap-4">
            {onNewMeetingClick ? (
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-1.5"
                onClick={onNewMeetingClick}
              >
                <Plus className="w-4 h-4" />
                New Meeting
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-1.5 opacity-50 cursor-not-allowed"
                disabled
              >
                <Plus className="w-4 h-4" />
                New Meeting
              </Button>
            )}

            <Avatar
              src={user?.avatar_url}
              name={user?.name || "User"}
              size="sm"
            />
          </div>
        </header>

        {/* Content Body viewport */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Global Cmd+K Command Palette Search Modal */}
      <CommandPalette />
    </div>
  );
}
