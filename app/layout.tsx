import type { Metadata } from "next";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = { variable: "font-sans" };
const geistMono = { variable: "font-mono" };

export const metadata: Metadata = {
  title: "Email Campaign Platform",
  description: "Professional email marketing platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
        <Toaster 
          position="top-right"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
