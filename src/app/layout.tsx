import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'photoswipe/style.css';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_TITLE,
  description: "Aplicación de mapas web que permite localizarse dentro de los campus de la UC.",
  icons: {
    icon: [
      { url: '/logo-uc-02.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32' },
    ],

  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://kit-digital-uc-prod.s3.amazonaws.com/uc-kitdigital/css/uc-kitdigital.css"
        />
         <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <script async src="https://kit-digital-uc-prod.s3.amazonaws.com/uc-kitdigital/js/uc-kitdigital.js"></script>
      </body>
    </html>
  );
}
