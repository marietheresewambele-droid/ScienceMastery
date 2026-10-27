import type { Metadata } from "next";
import "./globals.css";
import ProgressSync from "@/components/auth/ProgressSync";

export const metadata: Metadata = {
  title: "BrainSoma",
  description: "Free AQA GCSE Science mastery practice",
  icons: {
    icon: "/brainsoma-logo.png",
    shortcut: "/brainsoma-logo.png",
    apple: "/brainsoma-logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-cream text-ink"><ProgressSync />
        {children}
      </body>
    </html>
  );
}
