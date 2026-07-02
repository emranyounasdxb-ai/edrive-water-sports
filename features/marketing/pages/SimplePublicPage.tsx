import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PublicHeader } from '@/features/marketing/components/PublicHeader';

type Props = { title: string; description: string };

export function SimplePublicPage({ title, description }: Props) {
  return (
    <main className="min-h-screen bg-ocean-radial">
      <PublicHeader />
      <section className="luxury-container pb-24 pt-36">
        <Card className="min-h-[420px]">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.26em] text-primary">eDrive Water Sports</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-white md:text-6xl">{title}</h1>
            <p className="mt-6 text-lg leading-8 text-white/68">{description}</p>
            <div className="mt-8">
              <Button asChild>
                <Link href="/booking">Book Experience</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
