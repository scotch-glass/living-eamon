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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://living-eamon.vercel.app"
  ),
  title: "Living Eamon — One Hero. A Thousand Realms.",
  description:
    "An AI-driven persistent text adventure. Inspired by Robert E. Howard's tales of sword and sorcery.",
  openGraph: {
    title: "Living Eamon",
    description:
      "One Hero. A thousand realms. Inspired by Robert E. Howard's tales of sword and sorcery.",
    url: "/",
    siteName: "Living Eamon",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Living Eamon — a barbarian, a rescued woman, Persian warriors, a lich, and a distant flying saucer under a stormy sky",
        type: "image/jpeg",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Living Eamon — One Hero. A Thousand Realms.",
    description:
      "Inspired by Robert E. Howard's tales of sword and sorcery.",
    images: ["/og-image.jpg"],
  },
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
