import { BookingWizard } from './booking/booking-wizard';
import type { PublicLocale } from '@/lib/i18n/locales';
import type { BookingMessages, PackageMessages } from '@/lib/i18n/types';
import { enMessages } from '@/lib/i18n/messages/en';

export function BookingForm({ locale = 'en', messages = enMessages.booking, packageMessages = enMessages.packages }: { locale?: PublicLocale; messages?: BookingMessages; packageMessages?: PackageMessages }) {
  return <BookingWizard locale={locale} messages={messages} packageMessages={packageMessages} />;
}
