import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nexus — AI Automation Workspace",
    template: "%s | Nexus",
  },
  description:
    "Nexus combines meeting intelligence, resume screening, workflow automation, and AI-powered tasks — in one beautifully simple workspace.",
  keywords: ["AI automation", "meeting summarizer", "resume screener", "workflow generator", "AI workspace", "NVIDIA NIM"],
  openGraph: {
    title: "Nexus — The AI Automation Workspace",
    description: "One platform. Every AI workflow.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-white antialiased">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#ffffff",
            },
          }}
        />
      </body>
    </html>
  );
}
