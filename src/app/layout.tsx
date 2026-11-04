import type { Metadata } from "next";
import localFont from "next/font/local";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import { ProjectProvider } from "@/state/ProjectProvider";
import "./globals.css";

// Fonts are bundled in src/fonts (latin subset, from Fontsource, SIL OFL 1.1) so
// builds never depend on reaching Google Fonts.
const display = localFont({
  src: "../fonts/bricolage-grotesque-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-bricolage",
});

const sans = localFont({
  src: [
    { path: "../fonts/ibm-plex-sans-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/ibm-plex-sans-latin-500-normal.woff2", weight: "500" },
  ],
  variable: "--font-plex-sans",
});

const mono = localFont({
  src: "../fonts/ibm-plex-mono-latin-400-normal.woff2",
  weight: "400",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Normen AI",
  description:
    "A seven-phase lifecycle for shipping AI in the workplace, with guardrails built into every phase.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <ProjectProvider>
          <TopNav />
          <main id="main">{children}</main>
          <Footer />
        </ProjectProvider>
      </body>
    </html>
  );
}
