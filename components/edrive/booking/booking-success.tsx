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
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#FFF0B0,#D7A332_50%,#7B4B0F)] text-[#071F29] shadow-[0_18px_44px_rgba(153,105,20,0.32)]"><Check className="size-8" strokeWidth={2.5} aria-hidden="true" /></span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-primary">Pending Confirmation</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold text-foreground sm:text-5xl">Booking Request Sent</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">Thank you, {request.customerName}. Our booking team will check availability and contact you shortly.</p>
        </div>

        <div className="mt-9 grid gap-6 xl:grid-cols-[1fr_0.34fr]">
          <article className="relative overflow-hidden rounded-[2.15rem] border border-[#E6B94B]/90 bg-[#F5E5B8] p-[1px] shadow-[0_28px_72px_rgba(82,52,8,0.2)]">
            <VoucherNotch position="top" />
            <VoucherNotch position="bottom" />
            <div className="relative overflow-hidden rounded-[2.05rem] bg-[linear-gradient(120deg,#FFF8DF_0%,#E9C36C_44%,#FFF3CA_72%,#C48B2F_100%)] text-[#241807]">
              <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(115deg,rgba(255,255,255,0.55),transparent_25%,transparent_55%,rgba(255,255,255,0.2)),repeating-linear-gradient(90deg,rgba(77,47,7,0.09)_0_1px,transparent_1px_7px)]" />
              <div className="relative grid lg:grid-cols-[1fr_14rem]">
                <div>
                  <div className="relative min-h-[19rem] overflow-hidden border-b border-[#A96E20]/35 px-6 py-7 sm:px-8 lg:min-h-[21rem]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_25%,rgba(255,255,255,0.72),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.2),rgba(92,53,7,0.18))]" />
                    <div className="absolute right-0 top-0 h-full w-[58%] opacity-80 [background-image:radial-gradient(circle_at_70%_45%,rgba(0,137,150,0.18),transparent_20%),linear-gradient(160deg,transparent_0%,rgba(8,117,128,0.18)_50%,rgba(80,47,7,0.25)_100%)]" />
                    <div className="absolute bottom-8 right-8 hidden h-28 w-[44%] rounded-[4rem] border border-[#C28E2D]/45 bg-[linear-gradient(135deg,rgba(4,54,64,0.72),rgba(214,157,45,0.42))] shadow-[0_22px_48px_rgba(49,31,5,0.2)] lg:block">
                      <div className="absolute -right-8 bottom-5 h-16 w-44 rounded-full bg-[rgba(255,255,255,0.28)] blur-xl" />
                      <Waves className="absolute bottom-8 left-10 size-16 text-[#FFF0B0]/78" strokeWidth={1.3} aria-hidden="true" />
                      <Ship className="absolute right-16 top-7 size-14 text-[#FFF0B0]" strokeWidth={1.55} aria-hidden="true" />
                    </div>
                    <div className="relative z-10 max-w-[34rem]">
                      <p className="font-heading text-4xl font-semibold leading-none tracking-tight text-[#8B5B14] sm:text-5xl">eDrive</p>
                      <p className="mt-2 text-[0.72rem] font-bold uppercase tracking-[0.38em] text-primary-900">Water Sports</p>
                      <div className="mt-8 flex items-center gap-3 text-[#8B5B14]"><span className="h-px w-14 bg-current" /><Waves className="size-5" aria-hidden="true" /><span className="h-px w-14 bg-current" /></div>
                      <h2 className="mt-5 font-heading text-5xl font-semibold uppercase leading-none tracking-tight text-[#7D4A0B] sm:text-6xl">Booking<br />Request Sent</h2>
                      <div className="mt-5 inline-flex rounded-md border border-[#B77C22]/70 bg-[#D5A43D] px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#271600] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">Status: Pending Confirmation</div>
                    </div>
                  </div>

                  <div className="relative p-5 sm:p-7">
                    <div className="grid gap-3 rounded-[1.5rem] border border-[#C28E2D]/55 bg-[#FFF6D7]/88 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] sm:grid-cols-2 lg:grid-cols-4">
                      <VoucherItem icon={TicketCheck} label="Booking code" value={request.bookingCode} wide />
                      <VoucherItem icon={Ship} label="Service" value={experience.title} />
                      <VoucherItem icon={CalendarDays} label="Date" value={displayDate(request.preferredDate)} />
                      <VoucherItem icon={Clock3} label="Time" value={request.preferredTime} />
                      <VoucherItem icon={Timer} label={isSales ? 'Inquiry' : 'Duration'} value={durationLabel} />
                      <VoucherItem icon={UsersRound} label="Party" value={`${request.vehicleQuantity} ${request.vehicleQuantity === 1 ? 'vehicle' : 'vehicles'} · ${request.guestCount} guests`} />
                      <VoucherItem icon={MapPin} label="Meeting point" value={companyInfo.locationName} />
                      <VoucherItem icon={Crown} label="VIP pass" value="Premium access" />
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                      <div className="rounded-[1.35rem] border border-[#C28E2D]/40 bg-white/55 p-4">
                        <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[#8B5B14]">Marina access</p>
                        <p className="mt-2 text-base font-semibold text-[#1D1B16]">{companyInfo.locationName}</p>
                        <p className="mt-1 text-sm leading-6 text-[#5E513C]">{companyInfo.locationAddress}</p>
                        <a href={companyInfo.mapLink} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-full border border-[#C28E2D]/50 bg-[#FFF2C6] px-3 py-1.5 text-xs font-bold text-[#7D4A0B] hover:bg-[#FFE59B]">Open in Google Maps</a>
                      </div>
                      <div className="rounded-[1.35rem] border border-[#F4D47B]/65 bg-[#061F29] p-4 text-[#FFE9A5]">
                        <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[#F4D47B]">Estimated total</p>
                        <p className="mt-2 font-heading text-4xl font-semibold">{totalLabel}</p>
                        <div className="mt-4 h-10 rounded-lg bg-[#E6B94B] [background-image:repeating-linear-gradient(90deg,#171000_0_2px,transparent_2px_5px,#171000_5px_6px,transparent_6px_10px)]" />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 rounded-[1.35rem] border border-[#C28E2D]/28 bg-white/48 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3"><Headphones className="mt-1 size-5 shrink-0 text-[#8B5B14]" aria-hidden="true" /><p className="text-sm leading-6 text-[#4F432E]">Our concierge team will contact you shortly to confirm your premium water experience details.</p></div>
                    </div>
                  </div>
                </div>

                <aside className="relative hidden border-l border-dashed border-[#B77C22]/60 bg-[linear-gradient(180deg,#E0AE48,#F7D77E_45%,#B97B21)] p-5 lg:block">
                  <div className="absolute inset-0 opacity-32 [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.22)_0_1px,transparent_1px_8px)]" />
                  <div className="relative flex h-full flex-col items-center justify-between rounded-[1.35rem] border border-[#FFF0B0]/60 p-4 text-center shadow-inner">
                    <div>
                      <span className="mx-auto flex size-20 items-center justify-center rounded-full border border-[#6D4311]/35 bg-[#FFF0B0]/70 text-[#6D4311]"><Waves className="size-10" aria-hidden="true" /></span>
                      <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-[#6D4311]">Experience Pass</p>
                      <p className="mt-3 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#6D4311]/80">Jet Ski & Jet Car<br />Premium Access</p>
                    </div>
                    <div className="w-full rounded-2xl border border-[#6D4311]/30 bg-[#FFEAB0]/78 p-3">
                      <div className="mx-auto h-44 w-20 [background-image:repeating-linear-gradient(90deg,#1A1205_0_2px,transparent_2px_5px,#1A1205_5px_6px,transparent_6px_10px)]" />
                      <p className="mt-3 break-all text-[0.65rem] font-bold tracking-[0.16em] text-[#6D4311]">{request.bookingCode}</p>
                    </div>
                    <p className="text-[0.68rem] font-bold uppercase leading-5 tracking-[0.18em] text-[#6D4311]">Pure Freedom<br />Extraordinary<br />Experiences</p>
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
  return <span className={`absolute left-[calc(100%-14rem)] z-20 hidden size-9 -translate-x-1/2 rounded-full border border-[#E6B94B]/80 bg-background shadow-inner lg:block ${position === 'top' ? 'top-0 -translate-y-1/2' : 'bottom-0 translate-y-1/2'}`} aria-hidden="true" />;
}

function VoucherItem({ icon: Icon, label, value, wide = false }: { icon: LucideIcon; label: string; value: string; wide?: boolean }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border border-[#C28E2D]/22 bg-white/42 p-3 ${wide ? 'sm:col-span-2 lg:col-span-2' : ''}`}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#C28E2D]/55 bg-[linear-gradient(135deg,#FFE9A5,#C28E2D)] text-[#061F29] shadow-inner"><Icon className="size-5" aria-hidden="true" /></span>
      <div className="min-w-0"><p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#8B5B14]">{label}</p><p className="mt-1 text-sm font-semibold leading-5 text-[#1D1B16]">{value}</p></div>
    </div>
  );
}

function HelpfulCard({ title, text }: { title: string; text: string }) {
  return <div className="premium-surface rounded-[1.5rem] p-5"><p className="text-sm font-semibold text-foreground">{title}</p><p className="mt-2 text-xs leading-6 text-muted-foreground">{text}</p></div>;
}
