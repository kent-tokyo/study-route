import type { Metadata } from "next";
import "./globals.css";
import { ThemeScript } from "./theme-script";
import { LocaleProvider } from "@/i18n/context";

export const metadata: Metadata = {
  title: "study-route - 概念学習マップ",
  description: "数学・哲学・CS・化学・会計など、複数分野の概念を一歩ずつ学ぶ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased dark" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
