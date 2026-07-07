import { jetCarLightImage, jetSkiLightImage } from '@/lib/mock-data';

export type ExperienceId = 'jet-ski-rental' | 'jet-car-rental' | 'jet-ski-sales' | 'jet-car-sales';
export type ServiceType = 'rental' | 'sales_inquiry';

export type ExperienceOption = {
  id: ExperienceId;
  title: string;
  shortDescription: string;
  serviceType: ServiceType;
  image: string;
  startingPrice: number | null;
  capacity: number;
  recommended?: boolean;
};

export type BookingDraft = {
  selectedPackageName?: string;
  selectedPackageSlug?: string;
  selectedPackageCategory?: string;
  selectedPackageLocation?: string;
  selectedPackagePrice?: number;
  selectedPackageB2BPrice?: number;
  selectedPackageCapacity?: number;
  experienceType: ExperienceId;
  durationMinutes: number;
  inquiryType: string;
  vehicleQuantity: number;
  guestCount: number;
  preferredDate: string;
  preferredTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerHotelOrArea: string;
  customerNotes: string;
};

export type BookingRequest = {
  bookingCode: string;
  source: 'website';
  status: 'Pending';
  adminStatus: 'New';
  managerStatus: null;
  selectedPackageName?: string | null;
  selectedPackageSlug?: string | null;
  selectedPackageCategory?: string | null;
  selectedPackageLocation?: string | null;
  selectedPackagePrice?: number | null;
  experienceType: ExperienceId;
  serviceType: ServiceType;
  durationMinutes: number;
  inquiryType: string | null;
  vehicleQuantity: number;
  guestCount: number;
  preferredDate: string;
  preferredTime: string;
  meetingPointName: string;
  meetingPointAddress: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerHotelOrArea: string | null;
  customerNotes: string | null;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  paymentStatus: 'Not Paid';
  paymentMethod: null;
  createdAt: string;
};

export const experienceOptions: ExperienceOption[] = [
  { id: 'jet-ski-rental', title: 'Jet Ski Rental', shortDescription: 'A guided premium ride with safety equipment and marina support.', serviceType: 'rental', image: jetSkiLightImage, startingPrice: 300, capacity: 2, recommended: true },
  { id: 'jet-car-rental', title: 'Jet Car Rental', shortDescription: 'A private supercar-on-water experience with captain support.', serviceType: 'rental', image: jetCarLightImage, startingPrice: 500, capacity: 4 }
];

export const durationPackages: Record<'jet-ski-rental' | 'jet-car-rental', Array<{ minutes: number; price: number }>> = {
  'jet-ski-rental': [{ minutes: 30, price: 300 }, { minutes: 60, price: 450 }, { minutes: 90, price: 600 }, { minutes: 120, price: 700 }],
  'jet-car-rental': [{ minutes: 20, price: 500 }, { minutes: 30, price: 650 }, { minutes: 60, price: 1100 }],
};

export const inquiryTypes = ['New Unit', 'Pre-Owned Unit', 'Test Ride Request', 'Price Quote'];
export const timeSlots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'];

export const initialBookingDraft: BookingDraft = {
  experienceType: 'jet-ski-rental',
  durationMinutes: 60,
  inquiryType: 'Price Quote',
  vehicleQuantity: 1,
  guestCount: 2,
  preferredDate: '',
  preferredTime: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerHotelOrArea: '',
  customerNotes: '',
};

export function getExperience(id: ExperienceId) {
  return experienceOptions.find((experience) => experience.id === id) ?? experienceOptions[0];
}

export function getPackageUnitPrice(draft: BookingDraft) {
  const experience = getExperience(draft.experienceType);
  if (experience.serviceType === 'sales_inquiry') return 0;
  if (typeof draft.selectedPackagePrice === 'number') return draft.selectedPackagePrice;
  return durationPackages[draft.experienceType as 'jet-ski-rental' | 'jet-car-rental'].find((item) => item.minutes === draft.durationMinutes)?.price ?? 0;
}

export function getBookingTotals(draft: BookingDraft) {
  const experience = getExperience(draft.experienceType);
  if (experience.serviceType === 'sales_inquiry') return { subtotal: 0, vatAmount: 0, totalAmount: 0 };
  const subtotal = getPackageUnitPrice(draft) * draft.vehicleQuantity;
  const vatAmount = subtotal * 0.05;
  return { subtotal, vatAmount, totalAmount: subtotal + vatAmount };
}

export function formatAed(value: number) {
  return `AED ${value.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDuration(minutes: number) {
  return minutes < 60 ? `${minutes} minutes` : minutes === 60 ? '60 minutes' : `${minutes / 60} hours`;
}

export function generateBookingCode(existingCount: number) {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `ED-${date}-${String(existingCount + 1).padStart(3, '0')}`;
}
