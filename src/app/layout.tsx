import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/ui/Navbar";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: "MIMIX & MIMIXA - Premium Couples Game",
  description: "Test your romantic compatibility in this beautifully designed multiplayer experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-gradient-to-br from-pink-50 via-rose-50 to-peach-50 text-gray-900 min-h-screen antialiased selection:bg-rose-300 selection:text-white`}>
        <Navbar />
        <main className="pt-20">
          {children}
        </main>
      </body>
    </html>
  );
}
