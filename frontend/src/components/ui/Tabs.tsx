import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  children: React.ReactNode;
}

export function Tabs({ defaultValue, children, className, ...props }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("flex flex-col", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// ── Tab List ────────────────────────────────────────────────────────

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({ children, className, ...props }: TabsListProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-1 border-b border-brand-border p-1 bg-brand-surface/40",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ── Tab Trigger ──────────────────────────────────────────────────────

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({
  value,
  children,
  className,
  ...props
}: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used inside a Tabs component");

  const isActive = context.activeTab === value;

  return (
    <button
      type="button"
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 border-transparent text-brand-text-secondary transition-all hover:text-brand-text-primary cursor-pointer select-none -mb-1 px-1 mx-3 focus-visible:outline-none",
        isActive && "border-brand-accent text-brand-accent hover:text-brand-accent",
        className
      )}
      onClick={() => context.setActiveTab(value)}
      {...props}
    >
      {children}
    </button>
  );
}

// ── Tab Content ──────────────────────────────────────────────────────

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({
  value,
  children,
  className,
  ...props
}: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used inside a Tabs component");

  if (context.activeTab !== value) return null;

  return (
    <div
      className={cn(
        "flex-1 p-4 overflow-y-auto outline-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
