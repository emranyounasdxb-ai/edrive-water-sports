import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
