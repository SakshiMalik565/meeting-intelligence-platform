import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for Escape key to close the modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal dialog wrapper */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-xl border border-brand-border bg-brand-surface p-6 shadow-xl transition-all flex flex-col max-h-[90vh]",
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-4 shrink-0">
          <h2 className="text-lg font-semibold text-brand-text-primary">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 rounded-md text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-border/40"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto flex-1 pr-1 text-sm text-brand-text-secondary leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footer ? (
          <div className="flex justify-end gap-3 pt-4 border-t border-brand-border mt-4 shrink-0">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
