import Image from 'next/image';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { whatsappMessageUrl } from '@/lib/company-info';
import { dubaiWaterfrontImage } from '@/lib/mock-data';
import { PublicVideoHero } from './public-video-hero';
import type { PublicLocale } from '@/lib/i18n/locales';
import type { MembershipMessages } from '@/lib/i18n/types';
import { enMessages } from '@/lib/i18n/messages/en';

const sectionPad = 'py-10 sm:py-12 lg:py-14';
const membershipImage = '/images/edrive/home/home-membership-gold-card.webp';
const membershipWhatsappUrl = whatsappMessageUrl(encodeURIComponent(
  'Hello eDrive, I would like to know more about the eDrive Signature Membership.'
));

const membershipBenefits = [
  'Member-only offers',
  'Priority WhatsApp support',
  'Birthday discount',
  'Ride recommendations',
  'Better booking support',
  'Priority slots',
  'Weekday offers',
  'Friends/family add-on support',
  'VIP planning',
  'Priority sunset slots',
  'Custom ride support',
  'Dedicated contact flow'
];

const membershipComparison = [
  { feature: 'Member-only offers', edrive: 'Included', others: 'May be limited' },
  { feature: 'Priority WhatsApp support', edrive: 'Included', others: 'Not always standard' },
  { feature: 'Birthday discount', edrive: 'Included', others: 'Not always available' },
  { feature: 'Ride recommendations', edrive: 'Included', others: 'General support only' },
  { feature: 'Better booking support', edrive: 'Included', others: 'Standard booking flow' },
  { feature: 'Priority slots', edrive: 'Included', others: 'Subject to normal availability' },
  { feature: 'Weekday offers', edrive: 'Included', others: 'May vary' },
  { feature: 'Friends/family add-on support', edrive: 'Included', others: 'May be limited' },
  { feature: 'VIP planning', edrive: 'Included', others: 'Often separate' },
  { feature: 'Priority sunset slots', edrive: 'Included', others: 'Not guaranteed' },
  { feature: 'Custom ride support', edrive: 'Included', others: 'Often by special request' },
  { feature: 'Dedicated contact flow', edrive: 'Included', others: 'Not commonly included' }
];

export function MembershipPage({ locale = 'en', messages = enMessages.membership }: { locale?: PublicLocale; messages?: MembershipMessages }) {
  const membershipComparison = messages.features.map((feature, index) => ({ feature, others: messages.comparisonOthers[index] || '' }));
  return (
    <>
      <PublicVideoHero
        title={messages.heroTitle}
        text={messages.heroText}
        fallbackImage={dubaiWaterfrontImage}
        fallbackAlt={messages.heroAlt}
        actions={[
          {
            href: membershipWhatsappUrl,
            label: messages.inquiry,
            icon: MessageCircle,
            external: true
          }
        ]}
      />

      <section className={`container-x ${sectionPad}`}>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Card className="premium-card-hover overflow-hidden rounded-[1.75rem] border-white/70 bg-white/90 shadow-lg">
            <Image
              src={membershipImage}
              alt={messages.heroAlt}
              width={1200}
              height={800}
              className="aspect-[3/2] w-full object-cover"
              priority
            />
          </Card>

          <Card className="premium-card-hover rounded-[1.75rem] border-white/70 bg-white/95 shadow-lg">
            <CardContent className="p-6 sm:p-7 lg:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                {messages.benefitsEyebrow}
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-foreground sm:text-[2rem]">
                {messages.benefitsTitle}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                {messages.benefitsText}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {messages.features.map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary-50/40 p-3"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="text-sm text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button asChild className="mt-7 w-full rounded-full sm:w-auto">
                <a href={membershipWhatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle data-icon aria-hidden="true" />
                  {messages.whatsapp}
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-y border-border bg-white/70">
        <div className={`container-x ${sectionPad}`}>
          <div>
            <h2 className="section-title">{messages.comparisonTitle}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              {messages.ctaText}
            </p>
          </div>

          <div className="mt-7 overflow-hidden rounded-[1.5rem] border border-border/70 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full border-collapse text-left">
                <thead>
                  <tr className="bg-primary-900 text-white">
                    <th className="px-4 py-4 text-sm font-semibold sm:px-5">{messages.feature}</th>
                    <th className="px-4 py-4 text-sm font-semibold sm:px-5">{messages.edrive}</th>
                    <th className="px-4 py-4 text-sm font-semibold sm:px-5">{messages.typical}</th>
                  </tr>
                </thead>
                <tbody>
                  {membershipComparison.map((row, index) => (
                    <tr key={row.feature} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="px-4 py-4 text-sm font-medium text-foreground sm:px-5">{row.feature}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-emerald-700 sm:px-5">
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                          {messages.included}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground sm:px-5">{row.others}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Button asChild className="rounded-full">
              <a href={membershipWhatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle data-icon aria-hidden="true" />
                {messages.ctaTitle}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
