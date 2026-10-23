import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AnalysisModeProvider } from "@/context/AnalysisModeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "X Clone · Real-Time Simulation Feed",
  description: "Faithful X clone interface powered by SQLite and canonical OSINT streams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-black text-[#e7e9ea] font-sans selection:bg-[#1d9bf0]/30 selection:text-white">
        <AnalysisModeProvider>
          {children}
        </AnalysisModeProvider>
      </body>
    </html>
  );
}
