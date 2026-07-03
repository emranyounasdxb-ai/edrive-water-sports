import { ChevronDown, Info, MapPin, ShieldCheck, SunMedium, Waves } from 'lucide-react';
import { companyInfo } from '@/lib/company-info';

const bookingInfo = [
  { icon: ShieldCheck, title: "What's Included", text: 'Safety briefing, life jacket, dock assistance, route guidance, and marina team support.' },
  { icon: SunMedium, title: 'What to Bring', text: 'A valid photo ID, comfortable swimwear, sun protection, extra clothes, and a towel.' },
  { icon: MapPin, title: 'Meeting Point', text: `${companyInfo.locationName}, ${companyInfo.locationAddress}. Please arrive 20 minutes before your confirmed time.` },
  { icon: Info, title: 'Important Information', text: 'Riders must follow the crew briefing. A valid ID is required and age restrictions may apply to drivers.' },
  { icon: Waves, title: 'Cancellation / Weather Policy', text: 'Marine conditions are monitored daily. If conditions are unsafe, our team will help reschedule your experience.' },
];

export function BookingInfoAccordions() {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/80 shadow-[0_14px_32px_rgba(8,37,50,0.055)]">
      {bookingInfo.map((item, index) => {
        const Icon = item.icon;
        return (
          <details key={item.title} className="group" name="booking-information">
            <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-primary-50/55 ${index ? 'border-t border-border/70' : ''}`}>
              <span className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-xl bg-primary-50 text-primary"><Icon className="size-4" aria-hidden="true" /></span>{item.title}</span>
              <ChevronDown className="size-4 shrink-0 text-primary transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="border-t border-border/50 bg-white px-4 py-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
          </details>
        );
      })}
    </div>
  );
}
