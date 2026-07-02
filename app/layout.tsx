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
  metadataBase: new URL('https://edrivewatersports.ae'),
  icons: {
    icon: [
      { url: '/brand/favicon.ico' },
      { url: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/brand/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }]
  },
  openGraph: {
    title: 'eDrive Water Sports',
    description: 'Premium jet ski and jet car experiences from Dubai Island Marina.',
    url: 'https://edrivewatersports.ae',
    siteName: 'eDrive Water Sports',
    images: [{ url: '/brand/og-image.png', width: 1200, height: 630, alt: 'eDrive Water Sports' }],
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eDrive Water Sports',
    description: 'Premium jet ski and jet car experiences from Dubai Island Marina.',
    images: ['/brand/og-image.png']
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable}`}>{children}</body>
    </html>
  );
}
