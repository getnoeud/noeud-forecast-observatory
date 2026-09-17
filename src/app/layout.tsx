import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";

import { AppShell } from "@/components/shell/app-shell";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { probeDataSource } from "@/lib/server/db";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  display: "swap",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  display: "swap",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  display: "swap",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Noeud Forecast Observatory",
  description:
    "Internal observatory for the Noeud FX Forecast Intelligence pipeline: forward 30-day probabilistic forecasts, event intelligence, and model lineage.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const status = await probeDataSource();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AppShell
            status={status}
            projectRef={process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF}
          >
            {children}
          </AppShell>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
