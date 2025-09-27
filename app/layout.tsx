import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import Providers from "@/lib/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const rebelFont = localFont({
  src: "../public/fonts/Rebels-Fett.woff2",
  variable: "--font-rebels",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Flowyth",
  description: "Flow with the flow...",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="preload"
          href="/fonts/Rebels-Fett.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Ensure crypto.subtle is available for Dynamic.xyz
              if (typeof window !== 'undefined' && !window.crypto?.subtle) {
                console.warn('crypto.subtle not available - ensure HTTPS or localhost');
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${rebelFont.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}