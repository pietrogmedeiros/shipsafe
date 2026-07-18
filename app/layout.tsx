import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/PostHogProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.APP_URL || "https://safeship.space";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "SafeShip — seu app vibe-coded está vazando?",
  description:
    "Escaneie seu app publicado como um atacante faria: segredos expostos, Supabase sem RLS, .env e .git vazados, headers ausentes. Relatório com nota A–F e correções em português.",
  openGraph: {
    title: "SafeShip — seu app vibe-coded está vazando?",
    description:
      "Cole a URL do seu app e descubra o que está exposto para a internet antes que um atacante descubra. Nota A–F e correções em português.",
    url: siteUrl,
    siteName: "SafeShip",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <PostHogProvider
          apiKey={process.env.POSTHOG_KEY}
          host={process.env.POSTHOG_HOST}
        >
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
