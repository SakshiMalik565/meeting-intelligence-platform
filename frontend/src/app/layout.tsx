import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Fireflies.ai Clone | Meeting Intelligence Platform",
  description: "A production-grade meeting intelligence assistant. Transcribe, search, summarize, and manage meeting actions in a dark modern SaaS dashboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
