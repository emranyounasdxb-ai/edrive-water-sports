import { z } from 'zod';

export const bookingFormSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(120),
  phone: z.string().min(7, 'Phone number is required').max(30),
  whatsapp: z.string().max(30).optional().or(z.literal('')),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  country: z.string().min(2, 'Country is required').max(80),
  vehicleId: z.string().uuid('Select a vehicle'),
  date: z.string().min(1, 'Date is required'),
  timeSlot: z.string().min(1, 'Time slot is required'),
  durationMinutes: z.coerce.number().int().refine((value) => [30, 60, 90, 120, 180].includes(value), 'Invalid duration'),
  specialNotes: z.string().max(1000).optional().or(z.literal('')),
  couponCode: z.string().max(40).optional().or(z.literal('')),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
