import type { Metadata } from 'next';
import { Prompt } from 'next/font/google';
import './globals.css';

const prompt = Prompt({
  variable: '--font-sans',
  subsets: ['latin', 'thai'],
  weight: ['300', '400', '500', '600', '700', '800'],
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
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${prompt.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-mesh">{children}</body>
    </html>
  );
}
