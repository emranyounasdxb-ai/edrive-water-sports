import { BookingForm } from '@/features/booking/components/BookingForm';
import { PublicHeader } from '@/features/marketing/components/PublicHeader';

export function BookingPage() {
  return (
    <main className="min-h-screen bg-ocean-radial">
      <PublicHeader />
      <section className="luxury-container grid gap-8 pb-24 pt-36 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="text-sm uppercase tracking-[0.26em] text-primary">Online Booking</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-white md:text-6xl">Reserve your water sports experience</h1>
          <p className="mt-6 text-lg leading-8 text-white/68">
            Submit your preferred date, vehicle, time, and duration. Availability is validated before the booking is accepted.
          </p>
        </div>
        <BookingForm />
      </section>
    </main>
  );
}
