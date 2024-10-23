import './globals.css';

import type { Metadata } from 'next';
import Head from 'next/head';

export const metadata: Metadata = {
  title: 'Backer',
  description: 'Generated by create next app',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <meta charSet="utf-8" />
      </Head>
      <body>{children}</body>
    </html>
  );
}
