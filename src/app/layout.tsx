import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Obsidian AI",
  description: "AI powered notes for Obsidian",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex flex-row gap-x-8 p-4 bg-gray-100">
          <div className="text-md bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            Obsidian AI
          </div>
          <div>{">"}</div>
          <Link className="hover:underline" href="/chat">
            Chat
          </Link>
          <Link className="hover:underline" href="/embedding">
            Embedding
          </Link>
          <Link className="hover:underline" href="/search">
            Search
          </Link>
        </div>
        {children}
      </body>
    </html>
  );
}
