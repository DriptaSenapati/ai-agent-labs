import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const interSans = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Interviewer",
  description: "get ready for your next interview",
  authors: [
    {
      name: "Dripta Senapati",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${interSans.variable} ${geistMono.variable} antialiased h-full`}
    >
      <body className="h-full">
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
