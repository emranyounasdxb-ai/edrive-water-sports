import { ChevronDown } from 'lucide-react';
import { companyInfo } from '@/lib/company-info';

const bookingInfo = [
  { title: "What's Included", text: 'Safety briefing, life jacket, dock assistance, and route guidance from our marina team.' },
  { title: 'What to Bring', text: 'A valid photo ID, comfortable swimwear, sun protection, and a towel.' },
  { title: 'Meeting Point', text: `${companyInfo.locationName}, ${companyInfo.locationAddress}. Please arrive 20 minutes before your confirmed time.` },
  { title: 'Important Information', text: 'Riders must follow the crew briefing. A valid ID is required and age restrictions may apply to drivers.' },
  { title: 'Cancellation / Weather Policy', text: 'Marine conditions are monitored daily. If conditions are unsafe, our team will help reschedule your experience.' },
];

export function BookingInfoAccordions() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/70 shadow-[0_14px_35px_rgba(8,37,50,0.05)]">
      {bookingInfo.map((item, index) => (
        <details key={item.title} className="group" name="booking-information">
          <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-foreground transition hover:bg-white ${index ? 'border-t border-border/70' : ''}`}>
            {item.title}
            <ChevronDown className="size-4 shrink-0 text-primary transition group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="border-t border-border/50 bg-white/55 px-5 py-4 text-sm leading-6 text-muted-foreground">{item.text}</p>
        </details>
      ))}
    </div>
  );
}
