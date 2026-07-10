import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gallery | eDrive Water Sports',
  description: 'Explore eDrive Water Sports Dubai ride visuals and premium water sports experiences.'
};

export default function Page() {
  return (
    <section className="container-x py-16 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Gallery</p>
        <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight text-foreground sm:text-5xl">Dubai water sports moments</h1>
        <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
          Explore our jet ski, jet car, and premium marine experiences through the current ride pages and package cards.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/fleet" className="inline-flex h-11 items-center justify-center rounded-full bg-primary-900 px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(8,37,50,0.18)] transition hover:bg-primary-800">
            View Fleet
          </Link>
          <Link href="/#live-packages" className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-white px-6 text-sm font-bold text-foreground transition hover:bg-primary-50">
            View Packages
          </Link>
        </div>
      </div>
    </section>
  );
}
