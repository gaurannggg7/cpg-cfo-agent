import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import ScanlinesOverlay from '@/components/ScanlinesOverlay';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Baseline — Autonomous Financial Intelligence',
  description:
    'Baseline analyzes transactional data, detects meaningful financial deviations, explains what changed, and recommends what to do about it.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>
        <ScanlinesOverlay />
        {children}
      </body>
    </html>
  );
}
