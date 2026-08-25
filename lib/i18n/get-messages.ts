import type { PublicLocale } from '@/lib/i18n/locales';
import { arMessages } from '@/lib/i18n/messages/ar';
import { enMessages } from '@/lib/i18n/messages/en';
import { ruMessages } from '@/lib/i18n/messages/ru';

const messages = { en: enMessages, ar: arMessages, ru: ruMessages } as const;

export function getPublicMessages(locale: PublicLocale) {
  return messages[locale];
}
