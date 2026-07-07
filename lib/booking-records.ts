import { BookingRequest, BookingStatus, ExperienceId, PaymentStatus, ServiceType, normalizeBookingStatus } from '@/lib/booking-data';

export const bookingRequestsTable = 'booking_requests';

const toNumber = (value: unknown) => Number(value || 0);
const toText = (value: unknown) => String(value ?? '');
const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim();
  return text || null;
};

export function bookingRequestToRow(request: BookingRequest) {
  return {
    booking_code: request.bookingCode,
    source: request.source,
    status: request.status,
    admin_status: request.adminStatus,
    manager_status: request.managerStatus,
    selected_package_name: request.selectedPackageName,
    selected_package_slug: request.selectedPackageSlug,
    selected_package_category: request.selectedPackageCategory,
    selected_package_location: request.selectedPackageLocation,
    selected_package_price: request.selectedPackagePrice,
    selected_package_b2b_price: request.selectedPackageB2BPrice,
    selected_package_capacity: request.selectedPackageCapacity,
    experience_type: request.experienceType,
    service_type: request.serviceType,
    duration_minutes: request.durationMinutes,
    inquiry_type: request.inquiryType,
    vehicle_quantity: request.vehicleQuantity,
    guest_count: request.guestCount,
    preferred_date: request.preferredDate,
    preferred_time: request.preferredTime,
    meeting_point_name: request.meetingPointName,
    meeting_point_address: request.meetingPointAddress,
    customer_name: request.customerName,
    customer_phone: request.customerPhone,
    customer_email: request.customerEmail,
    customer_hotel_or_area: request.customerHotelOrArea,
    customer_notes: request.customerNotes,
    subtotal: request.subtotal,
    vat_amount: request.vatAmount,
    total_amount: request.totalAmount,
    payment_status: request.paymentStatus,
    payment_method: request.paymentMethod,
    created_at: request.createdAt,
    updated_at: new Date().toISOString()
  };
}

export function bookingRowToRequest(row: Record<string, unknown>): BookingRequest {
  return {
    bookingCode: toText(row.booking_code),
    source: 'website',
    status: normalizeBookingStatus(row.status),
    adminStatus: (toText(row.admin_status) || 'New') as BookingRequest['adminStatus'],
    managerStatus: row.manager_status ? normalizeBookingStatus(row.manager_status) : null,
    selectedPackageName: toNullableText(row.selected_package_name),
    selectedPackageSlug: toNullableText(row.selected_package_slug),
    selectedPackageCategory: toNullableText(row.selected_package_category),
    selectedPackageLocation: toNullableText(row.selected_package_location),
    selectedPackagePrice: row.selected_package_price == null ? null : toNumber(row.selected_package_price),
    selectedPackageB2BPrice: row.selected_package_b2b_price == null ? null : toNumber(row.selected_package_b2b_price),
    selectedPackageCapacity: row.selected_package_capacity == null ? null : toNumber(row.selected_package_capacity),
    experienceType: toText(row.experience_type) as ExperienceId,
    serviceType: toText(row.service_type) as ServiceType,
    durationMinutes: toNumber(row.duration_minutes),
    inquiryType: toNullableText(row.inquiry_type),
    vehicleQuantity: toNumber(row.vehicle_quantity),
    guestCount: toNumber(row.guest_count),
    preferredDate: toText(row.preferred_date),
    preferredTime: toText(row.preferred_time),
    meetingPointName: toText(row.meeting_point_name),
    meetingPointAddress: toText(row.meeting_point_address),
    customerName: toText(row.customer_name),
    customerPhone: toText(row.customer_phone),
    customerEmail: toNullableText(row.customer_email),
    customerHotelOrArea: toNullableText(row.customer_hotel_or_area),
    customerNotes: toNullableText(row.customer_notes),
    subtotal: toNumber(row.subtotal),
    vatAmount: toNumber(row.vat_amount),
    totalAmount: toNumber(row.total_amount),
    paymentStatus: (toText(row.payment_status) || 'Not Paid') as PaymentStatus,
    paymentMethod: toNullableText(row.payment_method),
    createdAt: toText(row.created_at),
    updatedAt: toNullableText(row.updated_at)
  };
}

export function statusLabel(status: BookingStatus) {
  return status;
}
