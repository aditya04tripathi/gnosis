import type { Metadata } from "next";
import { Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { HydrationSuppressor } from "@/components/hydration-suppressor";
import { ReduxProvider } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Startup Validator - AI-Powered Startup Idea Validation",
    template: "%s | Startup Validator",
  },
  description:
    "Validate your startup ideas with AI-powered analysis. Get detailed feedback, project plans, and actionable insights to bring your idea to life.",
  keywords: [
    "startup",
    "validation",
    "AI",
    "business ideas",
    "entrepreneurship",
  ],
  authors: [{ name: "Startup Validator" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Startup Validator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Startup Validator - AI-Powered Startup Idea Validation",
    description: "Validate your startup ideas with AI-powered analysis",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`dark ${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <HydrationSuppressor />

        <ReduxProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
