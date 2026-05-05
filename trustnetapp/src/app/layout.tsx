import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import FloatingFaucetButton from "./components/FloatingFaucetButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TrustNet - Decentralized Fact-Checking",
  description: "A decentralized platform for fact-checking and verifying claims",
  icons: {
    icon: '/Logo.png',
    apple: '/Logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThirdwebProvider>
          <div className="min-h-screen bg-[#13131a]">
            <Navbar />
            <div className="flex">
              <div className="fixed left-4 top-24 z-30">
                <Sidebar />
              </div>
              <main className="flex-1 md:ml-24 ml-0">
                {children}
              </main>
            </div>
            <FloatingFaucetButton />
          </div>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
