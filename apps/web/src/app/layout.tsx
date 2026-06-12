import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'YT Trend Tracker — Views Per Hour Leaderboard',
  description:
    'Open-source YouTube trend tracker. See which videos are going viral right now with real-time Views Per Hour (VPH) analytics.',
  keywords: [
    'YouTube',
    'trend',
    'tracker',
    'VPH',
    'views per hour',
    'analytics',
    'leaderboard',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-mesh">{children}</body>
    </html>
  );
}
