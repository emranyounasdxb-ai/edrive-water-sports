export type OperationsBooking = Record<string, unknown> & {
  id?: string | null;
  booking_code?: string | null;
  booking_number?: string | null;
  status?: string | null;
  admin_status?: string | null;
  manager_status?: string | null;
  selected_package_name?: string | null;
  selected_package_category?: string | null;
  service_type?: string | null;
  experience_type?: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  total_amount?: number | string | null;
  amount_received_aed?: number | string | null;
  amount_pending_aed?: number | string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  payment_source?: string | null;
  payment_workflow_status?: string | null;
  collection_status?: string | null;
  assigned_manager_name?: string | null;
  assigned_vehicle_name?: string | null;
  b2b_agent_name?: string | null;
  created_at?: string | null;
};

export type CompanyLedgerEntry = Record<string, unknown> & {
  id?: string | null;
  receipt_id?: string | null;
  booking_code?: string | null;
  account_type?: string | null;
  account_name?: string | null;
  entry_type?: string | null;
  amount?: number | string | null;
  narration?: string | null;
  created_at?: string | null;
};

export function reportText(value: unknown, fallback = '') {
  const clean = String(value ?? '').trim();
  return clean || fallback;
}

export function reportAmount(value: unknown) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function bookingCode(booking: OperationsBooking) {
  return reportText(booking.booking_code || booking.booking_number || booking.id, 'Booking');
}

export function packageName(booking: OperationsBooking) {
  return reportText(
    booking.selected_package_name || booking.selected_package_category || booking.experience_type || booking.service_type,
    'Package'
  );
}

export function bookingDateKey(booking: OperationsBooking) {
  return reportText(booking.preferred_date || booking.created_at).slice(0, 10);
}

export function dubaiTodayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function normalized(value: unknown) {
  return reportText(value).toLowerCase().replace(/_/g, ' ');
}

export function isNoShow(booking: OperationsBooking) {
  return [booking.status, booking.manager_status, booking.payment_status]
    .map(normalized)
    .some((value) => value === 'no show');
}

export function isCancelled(booking: OperationsBooking) {
  return [booking.status, booking.manager_status, booking.payment_status, booking.payment_workflow_status]
    .map(normalized)
    .some((value) => value.includes('cancel'));
}

export function isCompleted(booking: OperationsBooking) {
  return [booking.status, booking.manager_status].map(normalized).includes('completed');
}

export function isInProgress(booking: OperationsBooking) {
  const statusValues = [booking.status, booking.manager_status].map(normalized);
  return statusValues.includes('in progress') || normalized(booking.payment_workflow_status).includes('ride in progress');
}

export function isConfirmed(booking: OperationsBooking) {
  return normalized(booking.status) === 'confirmed';
}

export function isPendingRequest(booking: OperationsBooking) {
  const status = normalized(booking.status || 'pending');
  const adminStatus = normalized(booking.admin_status || 'new');
  return status === 'pending' || adminStatus === 'new' || (status === 'confirmed' && !reportText(booking.assigned_manager_name));
}

export function isB2BBooking(booking: OperationsBooking) {
  return normalized(booking.payment_source) === 'b2b'
    || Boolean(reportText(booking.b2b_agent_name))
    || normalized(booking.payment_method) === 'b2b invoice';
}

export function isCompanyReceived(booking: OperationsBooking) {
  const collection = normalized(booking.collection_status);
  const workflow = normalized(booking.payment_workflow_status);
  return collection === 'company received'
    || workflow.includes('received by admin')
    || workflow.includes('company received')
    || workflow === 'b2b paid'
    || workflow === 'direct payment collected';
}

export function isRevenueBooking(booking: OperationsBooking) {
  return isCompleted(booking) && !isNoShow(booking) && !isCancelled(booking);
}

export function bookingTotal(booking: OperationsBooking) {
  return Math.max(reportAmount(booking.total_amount), 0);
}

export function bookingReceived(booking: OperationsBooking) {
  if (isNoShow(booking) || isCancelled(booking)) return 0;
  return Math.min(Math.max(reportAmount(booking.amount_received_aed), 0), bookingTotal(booking));
}

export function bookingPending(booking: OperationsBooking) {
  if (!isRevenueBooking(booking)) return 0;
  const total = bookingTotal(booking);
  const received = bookingReceived(booking);
  const saved = Math.max(reportAmount(booking.amount_pending_aed), 0);
  if (saved > 0) return Math.min(saved, total);
  return Math.max(total - received, 0);
}

export function earnedRevenue(booking: OperationsBooking) {
  return isRevenueBooking(booking) ? bookingTotal(booking) : 0;
}

export function customerCollected(booking: OperationsBooking) {
  return isRevenueBooking(booking) ? bookingReceived(booking) : 0;
}

export function managerOutstanding(booking: OperationsBooking) {
  const method = normalized(booking.payment_method);
  if (!isRevenueBooking(booking) || isB2BBooking(booking) || isCompanyReceived(booking)) return 0;
  if (!reportText(booking.assigned_manager_name) || !['cash', 'card'].includes(method)) return 0;
  return bookingReceived(booking);
}

export function b2bOutstanding(booking: OperationsBooking) {
  return isRevenueBooking(booking) && isB2BBooking(booking) ? bookingPending(booking) : 0;
}

export function directOutstanding(booking: OperationsBooking) {
  return isRevenueBooking(booking) && !isB2BBooking(booking) ? bookingPending(booking) : 0;
}

export function totalOutstanding(booking: OperationsBooking) {
  return managerOutstanding(booking) + b2bOutstanding(booking) + directOutstanding(booking);
}

export function companyLedgerAmount(entry: CompanyLedgerEntry) {
  return normalized(entry.account_type) === 'company' && normalized(entry.entry_type) === 'company in'
    ? Math.max(reportAmount(entry.amount), 0)
    : 0;
}

export function bookingStage(booking: OperationsBooking) {
  if (isNoShow(booking)) return 'No Show';
  if (isCancelled(booking)) return 'Cancelled';
  if (isCompleted(booking)) return 'Completed';
  if (isInProgress(booking)) return 'In Progress';
  if (isConfirmed(booking) && reportText(booking.assigned_manager_name)) return 'Assigned';
  if (isConfirmed(booking)) return 'Confirmed';
  return 'Pending';
}

export function sumAmounts<T>(rows: T[], getter: (row: T) => number) {
  return rows.reduce((sum, row) => sum + getter(row), 0);
}
