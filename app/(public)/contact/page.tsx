import type { Metadata } from 'next';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { companyInfo, whatsappUrl } from '@/lib/company-info';
import { ContactForm } from '@/components/edrive/contact-form';

export const metadata: Metadata = {
  title: 'Contact'
};

const contacts = [
  { icon: Phone, title: 'Landline', text: companyInfo.landlineDisplay, href: `tel:${companyInfo.landlineHref}` },
  { icon: MessageCircle, title: 'WhatsApp', text: companyInfo.whatsappDisplay, href: whatsappUrl },
  { icon: Mail, title: 'Booking Email', text: companyInfo.bookingEmail, href: `mailto:${companyInfo.bookingEmail}` },
  { icon: Mail, title: 'General Email', text: companyInfo.supportEmail, href: `mailto:${companyInfo.supportEmail}` },
  { icon: MapPin, title: 'Location', text: companyInfo.locationName, href: '#map' }
];

export default function Page() {
  return (
    <>
      <section className="border-b border-border bg-white/70 soft-grid">
        <div className="container-x py-14 sm:py-16">
          <span className="soft-label">Contact</span>
          <h1 className="mt-6 max-w-3xl font-heading text-4xl font-semibold leading-tight text-foreground sm:text-5xl">Talk to our Dubai team</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">Ask about availability, group bookings, private events, or watercraft sales. Our team will help you choose the right next step.</p>
        </div>
      </section>

      <section className="container-x py-16">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {contacts.map((item) => (
            <a key={item.title} href={item.href} className="premium-surface premium-card-hover rounded-[2rem] p-6">
              <item.icon className="size-6 text-primary" aria-hidden="true" />
              <h2 className="mt-4 truncate font-heading text-lg font-semibold text-foreground">{item.title}</h2>
              <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">{item.text}</p>
            </a>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <ContactForm />
          <Card id="map" className="overflow-hidden p-3">
            <div className="overflow-hidden rounded-[1.5rem]">
              <iframe
                src={companyInfo.mapEmbedSrc}
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="eDrive Water Sports location map"
                className="block w-full"
              />
            </div>
            <CardContent className="p-5">
              <h2 className="font-heading text-2xl font-semibold text-foreground">{companyInfo.locationName}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">Use the map for directions to our main marina location. For bookings and arrival instructions, contact our team by WhatsApp or email.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
