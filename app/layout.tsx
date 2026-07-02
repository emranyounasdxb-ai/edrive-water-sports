import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins'
});

export const metadata: Metadata = {
  title: {
    default: 'eDrive Water Sports',
    template: '%s | eDrive Water Sports'
  },
  description: 'Premium jet ski rentals, jet car rentals, sales, booking, gallery, contact, and static admin UI for eDrive Water Sports.',
  metadataBase: new URL('https://edrivewatersports.ae')
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable}`}>{children}</body>
    </html>
  );
}
