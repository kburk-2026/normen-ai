import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import { ProjectProvider } from "@/state/ProjectProvider";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
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
