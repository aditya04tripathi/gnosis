import type { Metadata } from "next";
import { Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { HydrationSuppressor } from "@/modules/shared/components/hydration-suppressor";
import { ThemeProvider } from "@/modules/shared/components/theme-provider";
import { Toaster } from "@/modules/shared/components/ui/sonner";
import { METADATA } from "@/modules/shared/constants";

const geistSans = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
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
        className={`dark ${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <HydrationSuppressor />

        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        <Script src="https://www.paypal.com/sdk/js?client-id=Aa14ohuhpGoXFkvTvx18F8CBnShbrhBBM2EQz4JKoSYlqQ1IuY_ymJUVpffSYhZRGtvz6B4QZrYWCtfW&currency=USD&intent=subscription&vault=true" />
      </body>
    </html>
  );
}
