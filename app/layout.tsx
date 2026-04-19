import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Linear_B, Cedarville_Cursive } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const linearB = Noto_Sans_Linear_B({
  variable: "--font-linear-b",
  weight: "400",
  subsets: ["linear-b"],
});

const cedarville = Cedarville_Cursive({
  variable: "--font-cedarville",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Living Eamon — One Hero. Infinite Realms.",
  description: "An AI-driven persistent text adventure in the tradition of Robert E. Howard's sword & sorcery and the classic Eamon system. Claim your legend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${linearB.variable} ${cedarville.variable} h-full antialiased`}
    >
      <head>
        <script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        ></script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
