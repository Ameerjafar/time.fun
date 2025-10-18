import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SolanaProvider } from "./components/wallet/ConnectWallet";
import { AuthProvider } from "./contexts/AuthContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Time.fun - Monetize Your Time & Expertise",
  description: "Connect with top creators, book 1-on-1 sessions, and unlock exclusive content. Your time is valuable - let's make it count.",
  keywords: "time monetization, creator economy, 1-on-1 sessions, blockchain, Web3, expertise sharing",
  authors: [{ name: "Time.fun Team" }],
  openGraph: {
    title: "Time.fun - Monetize Your Time & Expertise",
    description: "Connect with top creators, book 1-on-1 sessions, and unlock exclusive content.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Time.fun - Monetize Your Time & Expertise",
    description: "Connect with top creators, book 1-on-1 sessions, and unlock exclusive content.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <SolanaProvider>{children}</SolanaProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
