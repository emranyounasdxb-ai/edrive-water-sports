'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { bookingFormSchema, type BookingFormValues } from '@/features/booking/schemas/booking.schema';
import { createPublicBooking, type PublicBookingResult } from '@/features/booking/services/booking.service';
import { getPublicVehicles, type PublicVehicle } from '@/features/vehicles/services/vehicles.service';

const slots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
const durations = [30, 60, 90, 120, 180];

export function BookingForm() {
  const [vehicles, setVehicles] = useState<PublicVehicle[]>([]);
  const [result, setResult] = useState<PublicBookingResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      whatsapp: '',
      email: '',
      country: 'United Arab Emirates',
      vehicleId: '',
      date: '',
      timeSlot: '10:00',
      durationMinutes: 60,
      specialNotes: '',
      couponCode: '',
    },
  });

  useEffect(() => {
    getPublicVehicles().then(setVehicles).catch((error) => setFormError(error.message));
  }, []);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === form.watch('vehicleId')),
    [vehicles, form],
  );

  async function onSubmit(values: BookingFormValues) {
    setFormError(null);
    setResult(null);
    try {
      const created = await createPublicBooking(values);
      setResult(created);
      form.reset();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Booking failed.');
    }
  }

  return (
    <div className="glass-panel rounded-3xl p-5 md:p-7">
      {result ? (
        <div className="rounded-3xl border border-primary/30 bg-primary/10 p-6">
          <CheckCircle2 className="h-10 w-10 text-primary" />
          <h2 className="mt-4 text-2xl font-semibold text-white">Booking Request Received</h2>
          <p className="mt-2 text-white/70">Reference: {result.booking_number}</p>
          <p className="mt-1 text-white/70">Estimated total: AED {result.net_amount_aed.toFixed(2)}</p>
        </div>
      ) : null}

      {formError ? <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{formError}</div> : null}

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
        <Field label="Full Name" error={form.formState.errors.fullName?.message}>
          <input className="input-shell h-12 w-full rounded-2xl px-4" {...form.register('fullName')} placeholder="Your full name" />
        </Field>
        <Field label="Phone Number" error={form.formState.errors.phone?.message}>
          <input className="input-shell h-12 w-full rounded-2xl px-4" {...form.register('phone')} placeholder="+971..." />
        </Field>
        <Field label="WhatsApp Number" error={form.formState.errors.whatsapp?.message}>
          <input className="input-shell h-12 w-full rounded-2xl px-4" {...form.register('whatsapp')} placeholder="Optional" />
        </Field>
        <Field label="Email" error={form.formState.errors.email?.message}>
          <input className="input-shell h-12 w-full rounded-2xl px-4" {...form.register('email')} placeholder="name@example.com" />
        </Field>
        <Field label="Country" error={form.formState.errors.country?.message}>
          <input className="input-shell h-12 w-full rounded-2xl px-4" {...form.register('country')} />
        </Field>
        <Field label="Selected Vehicle" error={form.formState.errors.vehicleId?.message}>
          <select className="input-shell h-12 w-full rounded-2xl px-4" {...form.register('vehicleId')}>
            <option value="">Select vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name} — AED {vehicle.rental_price_aed_per_hour}/hour
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date" error={form.formState.errors.date?.message}>
          <input type="date" className="input-shell h-12 w-full rounded-2xl px-4" {...form.register('date')} />
        </Field>
        <Field label="Time Slot" error={form.formState.errors.timeSlot?.message}>
          <select className="input-shell h-12 w-full rounded-2xl px-4" {...form.register('timeSlot')}>
            {slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
          </select>
        </Field>
        <Field label="Duration" error={form.formState.errors.durationMinutes?.message}>
          <select className="input-shell h-12 w-full rounded-2xl px-4" {...form.register('durationMinutes')}>
            {durations.map((duration) => <option key={duration} value={duration}>{duration} minutes</option>)}
          </select>
        </Field>
        <Field label="Coupon Code" error={form.formState.errors.couponCode?.message}>
          <input className="input-shell h-12 w-full rounded-2xl px-4 uppercase" {...form.register('couponCode')} placeholder="Optional" />
        </Field>
        <Field label="Special Notes" error={form.formState.errors.specialNotes?.message} className="md:col-span-2">
          <textarea className="input-shell min-h-28 w-full rounded-2xl p-4" {...form.register('specialNotes')} placeholder="Any special request" />
        </Field>
        <div className="md:col-span-2 flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/60">Selected package</p>
            <p className="font-medium text-white">{selectedVehicle ? selectedVehicle.name : 'Choose a vehicle to continue'}</p>
          </div>
          <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit Booking
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-medium text-white/78">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-200">{error}</span> : null}
    </label>
  );
}
