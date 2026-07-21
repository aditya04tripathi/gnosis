import type { Metadata } from "next";
import { Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { HydrationSuppressor } from "@/modules/shared/components/hydration-suppressor";
import { ThemeProvider } from "@/modules/shared/components/theme-provider";
import { Toaster } from "@/modules/shared/components/ui/sonner";
import { METADATA } from "@/modules/shared/constants";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = METADATA.default;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`dark ${outfit.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <HydrationSuppressor />
        <div className="grain-overlay" aria-hidden />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
