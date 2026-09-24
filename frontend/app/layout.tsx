import type { Metadata } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/wallet";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import { AmbientNetwork } from "@/components/ui/ambient-network";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kredit Protocol",
  description: "Confidential Credential & Eligibility Protocol on Midnight",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative">
        <AmbientNetwork />
        <WalletProvider>
          <ConnectWalletButton />
          <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 w-full">
            {children}
          </main>
          <footer className="relative z-10 border-t border-line">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-xs text-dimmer font-mono">
              <span>Midnight Preprod</span>
              <span>Compact 0.23</span>
            </div>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
