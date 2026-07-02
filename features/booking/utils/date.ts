export function combineDubaiDateTime(date: string, timeSlot: string): string {
  return `${date}T${timeSlot}:00+04:00`;
}
