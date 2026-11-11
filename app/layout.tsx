import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "Streakly — Build better habits, one day at a time",
    template: "%s · Streakly",
  },
  description:
    "Streakly is a calm habit tracker with secure per-user sync. Check in daily, grow your streaks and keep your progress on every device.",
  applicationName: "Streakly",
  authors: [{ name: "Streakly" }],
  keywords: ["habit tracker", "streaks", "consistency", "daily habits", "productivity"],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090b0b" },
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeScript = `(function(){try{var stored=localStorage.getItem("streakly.theme");var dark=stored?stored==="dark":false;var root=document.documentElement;root.classList.toggle("dark",dark);root.style.colorScheme=dark?"dark":"light";}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
