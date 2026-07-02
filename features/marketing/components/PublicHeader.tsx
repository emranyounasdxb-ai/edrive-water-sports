import Link from 'next/link';
import { Anchor, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const nav = [
  { href: '/jet-ski-rentals', label: 'Jet Ski' },
  { href: '/jet-car-rentals', label: 'Jet Car' },
  { href: '/sales', label: 'Sales' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

export function PublicHeader() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-ocean-950/72 backdrop-blur-xl">
      <div className="luxury-container flex h-18 items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3 text-white">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-primary ring-1 ring-white/15">
            <Anchor className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold uppercase tracking-[0.24em]">eDrive</span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-white/68 transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/booking">Book Now</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
            <Link href="/admin">Admin Portal</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="md:hidden">
            <Link href="/admin">Admin</Link>
          </Button>
          <Button variant="ghost" size="sm" className="md:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
