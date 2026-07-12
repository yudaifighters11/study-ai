import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BottomTabBar } from "@/components/BottomTabBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "New Study",
  description: "各種資格試験の過去問演習とAIによる類題生成・弱点分析サービス",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 pb-16 text-gray-900">
        {children}
        <BottomTabBar />
      </body>
    </html>
  );
}
