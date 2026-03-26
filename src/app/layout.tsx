import type { Metadata } from "next";
// import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/ui/Navbar";

// const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
// const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: '--font-playfair' });
const inter = { variable: '' };
const playfair = { variable: '' };

export const metadata: Metadata = {
  title: "MIMIX & MIMIXA - Premium Couples Game",
  description: "Test your romantic compatibility in this beautifully designed multiplayer experience.",
};

import { BackgroundProvider } from "@/components/BackgroundContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import FloatingChat from "@/components/FloatingChat";
import GameInviteNotification from "@/components/ui/GameInviteNotification";
import WaitingForPartner from "@/components/ui/WaitingForPartner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-gradient-to-br from-pink-50 via-rose-50 to-peach-50 text-gray-900 min-h-screen antialiased selection:bg-rose-300 selection:text-white`}>
        <BackgroundProvider>
          <ProfileProvider>
            <Navbar />
            <GameInviteNotification />
            <WaitingForPartner />
            <FloatingChat />
            <main className="pt-20">
              {children}
            </main>
          </ProfileProvider>
        </BackgroundProvider>
      </body>
    </html>
  );
}
