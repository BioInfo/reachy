import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://runreachyrun.com"),
  title: "runreachyrun — Building a Reachy Mini Lite",
  description:
    "Documenting the journey of building and programming a Reachy Mini Lite robot. Dev journal, build timeline, apps, and experiments.",
  keywords: [
    "Reachy Mini",
    "robotics",
    "AI",
    "machine learning",
    "Claude Code",
    "development journal",
  ],
  authors: [{ name: "Justin Johnson" }],
  openGraph: {
    title: "runreachyrun — Building a Reachy Mini Lite",
    description:
      "Documenting the journey of building and programming a Reachy Mini Lite robot.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1376,
        height: 768,
        alt: "runreachyrun - Building a Reachy Mini Lite robot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "runreachyrun",
    description: "Building a Reachy Mini Lite robot",
    images: ["/og-image.png"],
  },
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
