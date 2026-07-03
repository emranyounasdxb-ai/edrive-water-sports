'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { CalendarDays, Check, Clock3, Crown, Headphones, Home, MapPin, MessageCircle, RefreshCw, Ship, TicketCheck, Timer, UsersRound, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingRequest, formatAed, formatDuration, getExperience } from '@/lib/booking-data';
import { companyInfo, whatsappUrl } from '@/lib/company-info';

function displayDate(value: string) {
  return new Intl.DateTimeFormat('en-AE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

export function BookingSuccess({ request, onAnother }: { request: BookingRequest; onAnother: () => void }) {
  const experience = getExperience(request.experienceType);
  const isSales = request.serviceType === 'sales_inquiry';
  const whatsappMessage = encodeURIComponent(`Hello eDrive, I have submitted booking request ${request.bookingCode}.`);
  const durationLabel = isSales ? request.inquiryType ?? 'Sales inquiry' : formatDuration(request.durationMinutes);
  const totalLabel = isSales ? 'Request quote' : formatAed(request.totalAmount);

  return (
    <section className="container-x py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#FFF4B8,#D5A036_54%,#8B5B14)] text-[#201305] shadow-[0_18px_45px_rgba(153,105,20,0.3)]"><Check className="size-8" strokeWidth={2.5} aria-hidden="true" /></span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-primary">Pending Confirmation</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold text-foreground sm:text-5xl">Booking Request Sent</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">Thank you, {request.customerName}. Our booking team will check availability and contact you shortly.</p>
        </div>

        <div className="mt-9 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <article className="relative overflow-visible rounded-[2.15rem] bg-[#6d430c] p-[2px] shadow-[0_30px_78px_rgba(82,52,8,0.22)]">
            <VoucherNotch position="top" />
            <VoucherNotch position="bottom" />
            <div className="relative overflow-hidden rounded-[2rem] border border-[#FFF0B0]/60 bg-[linear-gradient(130deg,#FFF6CF_0%,#E8BC54_22%,#FFF3CB_48%,#C28723_100%)] text-[#261704]">
              <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(115deg,rgba(255,255,255,0.55),transparent_23%,transparent_56%,rgba(255,255,255,0.22)),repeating-linear-gradient(90deg,rgba(68,40,5,0.08)_0_1px,transparent_1px_7px)]" />
              <div className="relative grid lg:grid-cols-[1fr_12.5rem]">
                <div className="min-w-0">
                  <div className="relative overflow-hidden border-b border-[#8B5B14]/35 px-6 pb-6 pt-7 sm:px-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.78),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.18),rgba(83,49,8,0.13))]" />
                    <div className="absolute right-0 top-0 hidden h-full w-[48%] bg-[radial-gradient(circle_at_64%_44%,rgba(10,126,136,0.18),transparent_25%),linear-gradient(150deg,transparent,rgba(4,54,64,0.16)_48%,rgba(119,72,9,0.18))] lg:block" />
                    <div className="absolute bottom-8 right-9 hidden h-28 w-[36%] rounded-[5rem] border border-[#8B5B14]/35 bg-[linear-gradient(135deg,rgba(7,60,71,0.78),rgba(242,196,90,0.42))] shadow-[0_24px_45px_rgba(52,32,5,0.2)] lg:block">
                      <div className="absolute -right-8 bottom-6 h-16 w-44 rounded-full bg-white/30 blur-xl" />
                      <Waves className="absolute bottom-8 left-9 size-16 text-[#FFF1A6]/75" strokeWidth={1.35} aria-hidden="true" />
                      <Ship className="absolute right-14 top-7 size-14 text-[#FFF1A6]" strokeWidth={1.5} aria-hidden="true" />
                    </div>
                    <div className="relative z-10 max-w-[35rem]">
                      <p className="font-heading text-5xl font-semibold leading-none tracking-tight text-[#70450b] drop-shadow-[0_1px_0_rgba(255,255,255,0.55)]">eDrive</p>
                      <p className="mt-2 text-[0.75rem] font-bold uppercase tracking-[0.4em] text-[#087C86]">Water Sports</p>
                      <div className="mt-7 flex items-center gap-3 text-[#70450b]"><span className="h-px w-14 bg-current" /><Waves className="size-5" strokeWidth={1.5} aria-hidden="true" /><span className="h-px w-14 bg-current" /></div>
                      <h2 className="mt-5 max-w-xl font-heading text-5xl font-semibold uppercase leading-none tracking-tight text-[#70450b] sm:text-6xl">Booking<br />Request Sent</h2>
                      <div className="mt-5 inline-flex rounded-md border border-[#7d4b0c]/50 bg-[linear-gradient(135deg,#A86E19,#F3CA61,#A86E19)] px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#241503] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">Status: Pending Confirmation</div>
                    </div>
                  </div>

                  <div className="relative p-5 sm:p-7">
                    <div className="grid gap-3 rounded-[1.5rem] border border-[#9E6517]/45 bg-[#FFF6D7]/78 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.76)] sm:grid-cols-2 xl:grid-cols-4">
                      <VoucherItem icon={TicketCheck} label="Booking code" value={request.bookingCode} wide />
                      <VoucherItem icon={Ship} label="Service" value={experience.title} />
                      <VoucherItem icon={CalendarDays} label="Date" value={displayDate(request.preferredDate)} />
                      <VoucherItem icon={Clock3} label="Time" value={request.preferredTime} />
                      <VoucherItem icon={Timer} label={isSales ? 'Inquiry' : 'Duration'} value={durationLabel} />
                      <VoucherItem icon={UsersRound} label="Party" value={`${request.vehicleQuantity} ${request.vehicleQuantity === 1 ? 'vehicle' : 'vehicles'} · ${request.guestCount} guests`} />
                      <VoucherItem icon={MapPin} label="Meeting point" value={companyInfo.locationName} />
                      <VoucherItem icon={Crown} label="VIP pass" value="Premium access" />
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.86fr]">
                      <div className="rounded-[1.35rem] border border-[#9E6517]/35 bg-white/52 p-4">
                        <p className="text-[0.66rem] font-black uppercase tracking-[0.2em] text-[#7d4b0c]">Marina access</p>
                        <p className="mt-2 text-base font-bold text-[#1D1B16]">{companyInfo.locationName}</p>
                        <p className="mt-1 text-sm leading-6 text-[#5E513C]">{companyInfo.locationAddress}</p>
                        <a href={companyInfo.mapLink} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-full border border-[#9E6517]/45 bg-[#FFF2C6] px-3 py-1.5 text-xs font-bold text-[#6D430C] hover:bg-[#FFE59B]">Open in Google Maps</a>
                      </div>
                      <div className="rounded-[1.35rem] border border-[#F4D47B]/70 bg-[linear-gradient(135deg,#2d1b03,#76500f_36%,#E3B449_100%)] p-4 text-[#FFF1A6] shadow-inner">
                        <p className="text-[0.66rem] font-black uppercase tracking-[0.2em] text-[#FFF1A6]">Estimated total</p>
                        <p className="mt-2 font-heading text-4xl font-semibold drop-shadow">{totalLabel}</p>
                        <div className="mt-4 h-10 rounded-lg border border-[#4d2d05]/45 bg-[#F6C94E] [background-image:repeating-linear-gradient(90deg,#1E1403_0_2px,transparent_2px_5px,#1E1403_5px_6px,transparent_6px_10px)]" />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 rounded-[1.35rem] border border-[#9E6517]/26 bg-white/48 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3"><Headphones className="mt-1 size-5 shrink-0 text-[#7d4b0c]" aria-hidden="true" /><p className="text-sm leading-6 text-[#4F432E]">Our concierge team will contact you shortly to confirm your premium water experience details.</p></div>
                    </div>
                  </div>
                </div>

                <aside className="relative hidden border-l border-dashed border-[#7d4b0c]/55 bg-[linear-gradient(180deg,#FFF0B0_0%,#E1B14A_25%,#B7761D_100%)] p-4 lg:block">
                  <div className="absolute inset-0 opacity-35 [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.25)_0_1px,transparent_1px_8px)]" />
                  <div className="relative flex h-full min-h-[33rem] flex-col items-center justify-between rounded-[1.35rem] border border-[#6D430C]/35 bg-[#FFD86A]/30 p-4 text-center shadow-inner">
                    <div>
                      <span className="mx-auto flex size-20 items-center justify-center rounded-full border border-[#6D430C]/35 bg-[#FFF2BD]/72 text-[#6D430C]"><Waves className="size-10" aria-hidden="true" /></span>
                      <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-[#6D430C]">Experience Pass</p>
                      <p className="mt-4 text-[0.7rem] font-black uppercase leading-5 tracking-[0.16em] text-[#6D430C]/85">Jet Ski & Jet Car<br />Premium Access</p>
                    </div>
                    <div className="w-full rounded-2xl border border-[#6D430C]/30 bg-[#FFEAB0]/78 p-3">
                      <div className="mx-auto h-44 w-20 [background-image:repeating-linear-gradient(90deg,#1A1205_0_2px,transparent_2px_5px,#1A1205_5px_6px,transparent_6px_10px)]" />
                      <p className="mt-3 break-all text-[0.64rem] font-black tracking-[0.16em] text-[#6D430C]">{request.bookingCode}</p>
                    </div>
                    <p className="text-[0.68rem] font-black uppercase leading-5 tracking-[0.18em] text-[#6D430C]">Pure Freedom<br />Extraordinary<br />Experiences</p>
                  </div>
                </aside>
              </div>
            </div>
          </article>

          <aside className="grid gap-4">
            <article className="premium-surface overflow-hidden rounded-[2rem] p-3">
              <div className="relative min-h-[220px] overflow-hidden rounded-[1.45rem] bg-primary-50">
                <iframe title={`${companyInfo.locationName} map`} src={companyInfo.mapEmbedSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" />
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary"><MapPin className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Meeting point</p><h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{companyInfo.locationName}</h2><p className="mt-1 text-sm text-muted-foreground">{companyInfo.locationAddress}</p></div></div>
              </div>
            </article>
            <HelpfulCard title="What happens next" text="Our team reviews your preferred date, time, and fleet availability." />
            <HelpfulCard title="Payment" text="No payment was taken. Payment details are shared only after confirmation." />
          </aside>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-5 rounded-[1.75rem] border border-primary/15 bg-primary-50 p-5 sm:flex-row sm:p-6">
          <div><p className="font-semibold text-foreground">Need to add something?</p><p className="mt-1 text-sm text-muted-foreground">Send the booking team your reference on WhatsApp.</p></div>
          <Button asChild><a href={`${whatsappUrl}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />WhatsApp us</a></Button>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="outline"><Link href="/"><Home data-icon aria-hidden="true" />Back to Home</Link></Button>
          <Button type="button" onClick={onAnother}><RefreshCw data-icon aria-hidden="true" />Book Another Experience</Button>
        </div>
      </div>
    </section>
  );
}

function VoucherNotch({ position }: { position: 'top' | 'bottom' }) {
  return <span className={`absolute left-[calc(100%-12.5rem)] z-20 hidden size-9 -translate-x-1/2 rounded-full border border-[#C9962F]/80 bg-background shadow-inner lg:block ${position === 'top' ? 'top-0 -translate-y-1/2' : 'bottom-0 translate-y-1/2'}`} aria-hidden="true" />;
}

function VoucherItem({ icon: Icon, label, value, wide = false }: { icon: LucideIcon; label: string; value: string; wide?: boolean }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border border-[#9E6517]/24 bg-white/42 p-3 ${wide ? 'sm:col-span-2 xl:col-span-2' : ''}`}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#6D430C]/30 bg-[linear-gradient(135deg,#FFF2A5,#D99F27)] text-[#251604] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"><Icon className="size-5" aria-hidden="true" /></span>
      <div className="min-w-0"><p className="text-[0.62rem] font-black uppercase tracking-[0.17em] text-[#7d4b0c]">{label}</p><p className="mt-1 text-sm font-bold leading-5 text-[#1D1B16]">{value}</p></div>
    </div>
  );
}

function HelpfulCard({ title, text }: { title: string; text: string }) {
  return <div className="premium-surface rounded-[1.5rem] p-5"><p className="text-sm font-semibold text-foreground">{title}</p><p className="mt-2 text-xs leading-6 text-muted-foreground">{text}</p></div>;
}
