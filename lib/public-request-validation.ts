export const DUBAI_TIME_ZONE = 'Asia/Dubai';

function dateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DUBAI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || '';
  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
    hour: Number(value('hour')),
    minute: Number(value('minute'))
  };
}

export function dubaiDateValue(date = new Date()) {
  const parts = dateParts(date);
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function dubaiDateParts(date = new Date()) {
  const parts = dateParts(date);
  return { year: parts.year, month: parts.month, day: parts.day };
}

export function dubaiCurrentMinutes(date = new Date()) {
  const parts = dateParts(date);
  return parts.hour * 60 + parts.minute;
}

export function timeLabelToMinutes(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return Number.NaN;
  const hoursRaw = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (hoursRaw < 1 || hoursRaw > 12 || minutes < 0 || minutes > 59) return Number.NaN;
  const hours = period === 'PM' && hoursRaw !== 12 ? hoursRaw + 12 : period === 'AM' && hoursRaw === 12 ? 0 : hoursRaw;
  return hours * 60 + minutes;
}

export function isSelectableDubaiBookingTime(selectedDate: string, selectedTime: string, now = new Date()) {
  if (!selectedDate || !selectedTime) return false;
  const today = dubaiDateValue(now);
  if (selectedDate < today) return false;
  if (selectedDate > today) return Number.isFinite(timeLabelToMinutes(selectedTime));
  const slotMinutes = timeLabelToMinutes(selectedTime);
  return Number.isFinite(slotMinutes) && slotMinutes > dubaiCurrentMinutes(now);
}

export function normalizePhoneDigits(value: string) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 10) digits = `971${digits.slice(1)}`;
  if (digits.startsWith('5') && digits.length === 9) digits = `971${digits}`;
  return digits;
}

export function isValidPhone(value: string) {
  const digits = normalizePhoneDigits(value);
  return digits.length >= 7 && digits.length <= 15;
}

export function isValidOptionalEmail(value: string) {
  const email = value.trim();
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function cleanSingleLine(value: string, maxLength: number) {
  return value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export function cleanMultiline(value: string, maxLength: number) {
  return value.replace(/\r/g, '').trim().slice(0, maxLength);
}
