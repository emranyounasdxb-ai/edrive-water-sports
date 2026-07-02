import { Mail, MapPin, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { companyInfo } from '@/lib/company-info';

export type PolicySection = {
  title: string;
  text: string;
};

export function PolicyPage({ label, title, intro, sections }: { label: string; title: string; intro: string; sections: PolicySection[] }) {
  return (
    <>
      <section className="border-b border-border bg-white/70 soft-grid">
        <div className="container-x py-14 sm:py-16">
          <span className="soft-label">{label}</span>
          <h1 className="mt-6 max-w-4xl font-heading text-4xl font-semibold leading-tight text-foreground sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground">{intro}</p>
        </div>
      </section>

      <section className="container-x py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">eDrive Water Sports</p>
                <h2 className="mt-3 font-heading text-2xl font-semibold text-foreground">Policy Information</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">These pages explain the main rules and customer information for bookings, privacy, payments, refunds, replacement options, and communication.</p>
                <div className="mt-6 flex flex-col gap-3 text-sm text-muted-foreground">
                  <a href={`tel:${companyInfo.landlineHref}`} className="flex items-center gap-3 transition hover:text-primary"><Phone className="size-4 text-primary" aria-hidden="true" />{companyInfo.landlineDisplay}</a>
                  <a href={`mailto:${companyInfo.bookingEmail}`} className="flex items-center gap-3 transition hover:text-primary"><Mail className="size-4 text-primary" aria-hidden="true" />{companyInfo.bookingEmail}</a>
                  <p className="flex items-center gap-3"><MapPin className="size-4 text-primary" aria-hidden="true" />{companyInfo.locationName}</p>
                </div>
              </CardContent>
            </Card>
          </aside>

          <div className="flex flex-col gap-5">
            {sections.map((section, index) => (
              <Card key={section.title} className="premium-card-hover">
                <CardContent className="p-6 sm:p-7">
                  <div className="flex items-start gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-sm font-bold text-primary">{index + 1}</span>
                    <div>
                      <h2 className="font-heading text-xl font-semibold text-foreground">{section.title}</h2>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{section.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
