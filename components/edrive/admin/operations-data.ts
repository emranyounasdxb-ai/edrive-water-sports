export type StaffRole = 'super_admin' | 'admin' | 'booking_manager' | 'finance' | 'captain' | 'driver';

export type BookingStatus =
  | 'New / Pending'
  | 'Contacted'
  | 'Confirmed'
  | 'Ready'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'No Show'
  | 'Rescheduled'
  | 'Refund Pending'
  | 'Refunded';

export type PaymentStatus = 'Unpaid' | 'Partial Paid' | 'Paid' | 'Refund Pending' | 'Refunded';
export type PaymentMethod = 'Cash' | 'Card' | 'Online Payment' | 'Bank Transfer' | 'Apple Pay' | 'Other';
export type CollectionStatus =
  | 'Pending Collection'
  | 'With Admin'
  | 'With Manager'
  | 'With Captain'
  | 'With Driver'
  | 'Deposited'
  | 'Verified by Finance';
export type FleetStatus = 'Available' | 'Assigned' | 'In Ride' | 'Maintenance' | 'Damaged' | 'Out of Service';

export type BookingActivity = {
  id: string;
  action: string;
  actor: string;
  role: StaffRole | 'system' | 'customer';
  createdAt: string;
  note?: string;
  previousStatus?: BookingStatus;
  newStatus?: BookingStatus;
};

export type OperationsBooking = {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceType: 'Jet Ski' | 'Jet Car' | 'Boat';
  vehicleType: 'jet_ski' | 'jet_car' | 'boat';
  preferredDate: string;
  preferredTime: string;
  durationMinutes: number;
  guestCount: number;
  meetingLocation: string;
  bookingStatus: BookingStatus;
  adminStatus: BookingStatus;
  managerStatus: BookingStatus | null;
  assignedManagerId: string | null;
  assignedManagerName: string | null;
  assignedVehicleId: string | null;
  assignedVehicleName: string | null;
  captainName: string;
  driverRequired: boolean;
  driverName: string;
  rideStartTime: string;
  rideEndTime: string;
  extraTimeMinutes: number;
  customerArrived: boolean;
  damageReported: boolean;
  damageNote: string;
  managerNote: string;
  internalNote: string;
  customerNote: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  amountReceived: number;
  amountPending: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentReceivedBy: string;
  paymentCollectedBy: string;
  collectionStatus: CollectionStatus;
  paymentNotes: string;
  source: 'Website' | 'Admin' | 'Walk-in';
  createdAt: string;
  updatedAt: string;
  activity: BookingActivity[];
};

export type FleetVehicle = {
  id: string;
  name: string;
  type: 'Jet Ski' | 'Jet Car' | 'Boat';
  status: FleetStatus;
  hourlyRate: number;
  capacity: number;
  registrationNumber: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  notes: string;
};

export const bookingStatuses: BookingStatus[] = [
  'New / Pending', 'Contacted', 'Confirmed', 'Ready', 'In Progress', 'Completed',
  'Cancelled', 'No Show', 'Rescheduled', 'Refund Pending', 'Refunded'
];

export const managerStatuses: BookingStatus[] = ['Ready', 'In Progress', 'Completed', 'Cancelled', 'No Show', 'Rescheduled'];
export const paymentStatuses: PaymentStatus[] = ['Unpaid', 'Partial Paid', 'Paid', 'Refund Pending', 'Refunded'];
export const paymentMethods: PaymentMethod[] = ['Cash', 'Card', 'Online Payment', 'Bank Transfer', 'Apple Pay', 'Other'];
export const collectionStatuses: CollectionStatus[] = ['Pending Collection', 'With Admin', 'With Manager', 'With Captain', 'With Driver', 'Deposited', 'Verified by Finance'];

export const operationsVehicles: FleetVehicle[] = [
  { id: 'JS-01', name: 'Yamaha FX Cruiser HO', type: 'Jet Ski', status: 'Available', hourlyRate: 650, capacity: 3, registrationNumber: 'DXB-JS-101', lastMaintenanceDate: '2026-06-12', nextMaintenanceDate: '2026-07-12', notes: 'Ready for service.' },
  { id: 'JS-02', name: 'Sea-Doo GTX Limited', type: 'Jet Ski', status: 'Assigned', hourlyRate: 720, capacity: 3, registrationNumber: 'DXB-JS-205', lastMaintenanceDate: '2026-06-18', nextMaintenanceDate: '2026-07-18', notes: 'Touring kit installed.' },
  { id: 'JC-01', name: 'Lamborghini Jet Car', type: 'Jet Car', status: 'In Ride', hourlyRate: 1250, capacity: 2, registrationNumber: 'DXB-JC-310', lastMaintenanceDate: '2026-06-21', nextMaintenanceDate: '2026-07-21', notes: 'Captain required.' },
  { id: 'JC-02', name: 'Corvette Jet Car', type: 'Jet Car', status: 'Damaged', hourlyRate: 1100, capacity: 2, registrationNumber: 'DXB-JC-411', lastMaintenanceDate: '2026-06-28', nextMaintenanceDate: '2026-07-05', notes: 'Port-side trim inspection required.' },
  { id: 'BT-01', name: 'Marina 28 Boat', type: 'Boat', status: 'Available', hourlyRate: 1800, capacity: 8, registrationNumber: 'DXB-BT-028', lastMaintenanceDate: '2026-06-15', nextMaintenanceDate: '2026-07-15', notes: 'Captain required.' },
];

const activity = (id: string, action: string, actor: string, role: BookingActivity['role'], createdAt: string, note?: string): BookingActivity => ({ id, action, actor, role, createdAt, note });

export const seedOperationsBookings: OperationsBooking[] = [
  {
    id: '10238', bookingCode: 'BK-10238', customerName: 'Fatima Al Blooshi', customerPhone: '+971 56 456 7890', customerEmail: 'fatima@example.com', serviceType: 'Jet Car', vehicleType: 'jet_car', preferredDate: '2026-07-02', preferredTime: '13:00', durationMinutes: 60, guestCount: 2, meetingLocation: 'Dubai Island Marina', bookingStatus: 'New / Pending', adminStatus: 'New / Pending', managerStatus: null, assignedManagerId: null, assignedManagerName: null, assignedVehicleId: null, assignedVehicleName: null, captainName: '', driverRequired: false, driverName: '', rideStartTime: '', rideEndTime: '', extraTimeMinutes: 0, customerArrived: false, damageReported: false, damageNote: '', managerNote: '', internalNote: '', customerNote: 'First visit. Please call before confirming.', totalAmount: 1250, discountAmount: 0, finalAmount: 1250, amountReceived: 0, amountPending: 1250, paymentStatus: 'Unpaid', paymentMethod: 'Cash', paymentReceivedBy: '', paymentCollectedBy: '', collectionStatus: 'Pending Collection', paymentNotes: '', source: 'Website', createdAt: '2026-07-02T08:15:00+04:00', updatedAt: '2026-07-02T08:15:00+04:00', activity: [activity('a-10238-1', 'Booking created from website', 'Website', 'customer', '2026-07-02T08:15:00+04:00', 'Awaiting admin review.')]
  },
  {
    id: '10237', bookingCode: 'BK-10237', customerName: 'Lina Petrova', customerPhone: '+971 52 234 5678', customerEmail: 'lina@example.com', serviceType: 'Boat', vehicleType: 'boat', preferredDate: '2026-07-02', preferredTime: '14:30', durationMinutes: 120, guestCount: 6, meetingLocation: 'Dubai Marina', bookingStatus: 'Contacted', adminStatus: 'Contacted', managerStatus: null, assignedManagerId: null, assignedManagerName: null, assignedVehicleId: null, assignedVehicleName: null, captainName: '', driverRequired: false, driverName: '', rideStartTime: '', rideEndTime: '', extraTimeMinutes: 0, customerArrived: false, damageReported: false, damageNote: '', managerNote: '', internalNote: 'Customer requested a shaded boat.', customerNote: 'Birthday group.', totalAmount: 3600, discountAmount: 200, finalAmount: 3400, amountReceived: 1000, amountPending: 2400, paymentStatus: 'Partial Paid', paymentMethod: 'Online Payment', paymentReceivedBy: 'Leena Park', paymentCollectedBy: 'Online', collectionStatus: 'Deposited', paymentNotes: 'Deposit received.', source: 'Website', createdAt: '2026-07-01T16:40:00+04:00', updatedAt: '2026-07-02T09:10:00+04:00', activity: [activity('a-10237-1', 'Booking created from website', 'Website', 'customer', '2026-07-01T16:40:00+04:00'), activity('a-10237-2', 'Admin marked contacted', 'Leena Park', 'admin', '2026-07-02T09:10:00+04:00', 'Guest confirmed six passengers.')]
  },
  {
    id: '10236', bookingCode: 'BK-10236', customerName: 'James Smith', customerPhone: '+971 55 345 6789', customerEmail: 'james@example.com', serviceType: 'Jet Ski', vehicleType: 'jet_ski', preferredDate: '2026-07-02', preferredTime: '15:00', durationMinutes: 60, guestCount: 2, meetingLocation: 'JBR Beach', bookingStatus: 'Confirmed', adminStatus: 'Confirmed', managerStatus: 'Confirmed', assignedManagerId: 'manager-1', assignedManagerName: 'Mohammed Ali', assignedVehicleId: 'JS-02', assignedVehicleName: 'Sea-Doo GTX Limited', captainName: '', driverRequired: true, driverName: 'Ali Raza', rideStartTime: '', rideEndTime: '', extraTimeMinutes: 0, customerArrived: false, damageReported: false, damageNote: '', managerNote: 'Prepare two life vests.', internalNote: '', customerNote: 'Beginner rider.', totalAmount: 720, discountAmount: 0, finalAmount: 720, amountReceived: 720, amountPending: 0, paymentStatus: 'Paid', paymentMethod: 'Card', paymentReceivedBy: 'Leena Park', paymentCollectedBy: 'Admin', collectionStatus: 'Verified by Finance', paymentNotes: 'Card payment verified.', source: 'Website', createdAt: '2026-07-01T12:20:00+04:00', updatedAt: '2026-07-02T09:30:00+04:00', activity: [activity('a-10236-1', 'Booking created from website', 'Website', 'customer', '2026-07-01T12:20:00+04:00'), activity('a-10236-2', 'Admin confirmed booking', 'Leena Park', 'admin', '2026-07-02T09:20:00+04:00', 'Moved to operations.'), activity('a-10236-3', 'Vehicle assigned', 'Mohammed Ali', 'booking_manager', '2026-07-02T09:30:00+04:00', 'Sea-Doo GTX Limited assigned.')]
  },
  {
    id: '10235', bookingCode: 'BK-10235', customerName: 'Omar Hassan', customerPhone: '+971 50 123 4567', customerEmail: 'omar@example.com', serviceType: 'Jet Car', vehicleType: 'jet_car', preferredDate: '2026-07-02', preferredTime: '16:00', durationMinutes: 60, guestCount: 2, meetingLocation: 'Dubai Island Marina', bookingStatus: 'Ready', adminStatus: 'Confirmed', managerStatus: 'Ready', assignedManagerId: 'manager-1', assignedManagerName: 'Mohammed Ali', assignedVehicleId: 'JC-01', assignedVehicleName: 'Lamborghini Jet Car', captainName: 'Omar Haddad', driverRequired: false, driverName: '', rideStartTime: '', rideEndTime: '', extraTimeMinutes: 0, customerArrived: true, damageReported: false, damageNote: '', managerNote: 'Guest checked in early.', internalNote: '', customerNote: '', totalAmount: 1250, discountAmount: 0, finalAmount: 1250, amountReceived: 850, amountPending: 400, paymentStatus: 'Partial Paid', paymentMethod: 'Cash', paymentReceivedBy: 'Mohammed Ali', paymentCollectedBy: 'Mohammed Ali', collectionStatus: 'With Manager', paymentNotes: 'Balance due before departure.', source: 'Admin', createdAt: '2026-07-01T10:00:00+04:00', updatedAt: '2026-07-02T11:10:00+04:00', activity: [activity('a-10235-1', 'Booking created by admin', 'Leena Park', 'admin', '2026-07-01T10:00:00+04:00'), activity('a-10235-2', 'Booking confirmed', 'Leena Park', 'admin', '2026-07-01T10:20:00+04:00'), activity('a-10235-3', 'Manager set ride Ready', 'Mohammed Ali', 'booking_manager', '2026-07-02T11:10:00+04:00', 'Guest checked in.')]
  },
  {
    id: '10234', bookingCode: 'BK-10234', customerName: 'Noura Al Mansoori', customerPhone: '+971 50 987 6543', customerEmail: 'noura@example.com', serviceType: 'Jet Car', vehicleType: 'jet_car', preferredDate: '2026-07-02', preferredTime: '17:30', durationMinutes: 60, guestCount: 2, meetingLocation: 'Dubai Island Marina', bookingStatus: 'In Progress', adminStatus: 'Confirmed', managerStatus: 'In Progress', assignedManagerId: 'manager-1', assignedManagerName: 'Mohammed Ali', assignedVehicleId: 'JC-01', assignedVehicleName: 'Lamborghini Jet Car', captainName: 'Omar Haddad', driverRequired: false, driverName: '', rideStartTime: '2026-07-02T17:32', rideEndTime: '', extraTimeMinutes: 0, customerArrived: true, damageReported: false, damageNote: '', managerNote: 'VIP guest. Sunset route requested.', internalNote: 'Prefers early arrival.', customerNote: 'Photo stop near Bluewaters.', totalAmount: 1250, discountAmount: 0, finalAmount: 1250, amountReceived: 1250, amountPending: 0, paymentStatus: 'Paid', paymentMethod: 'Cash', paymentReceivedBy: 'Mohammed Ali', paymentCollectedBy: 'Mohammed Ali', collectionStatus: 'With Manager', paymentNotes: 'Paid in full on arrival.', source: 'Website', createdAt: '2026-07-01T09:00:00+04:00', updatedAt: '2026-07-02T17:32:00+04:00', activity: [activity('a-10234-1', 'Booking created from website', 'Website', 'customer', '2026-07-01T09:00:00+04:00'), activity('a-10234-2', 'Admin confirmed booking', 'Leena Park', 'admin', '2026-07-01T09:30:00+04:00'), activity('a-10234-3', 'Payment updated', 'Mohammed Ali', 'booking_manager', '2026-07-02T17:10:00+04:00', 'Received AED 1,250 cash.'), activity('a-10234-4', 'Ride set In Progress', 'Mohammed Ali', 'booking_manager', '2026-07-02T17:32:00+04:00', 'Departed from marina.')]
  },
  {
    id: '10233', bookingCode: 'BK-10233', customerName: 'Adam Stone', customerPhone: '+971 52 876 5432', customerEmail: 'adam@example.com', serviceType: 'Jet Ski', vehicleType: 'jet_ski', preferredDate: '2026-07-02', preferredTime: '18:00', durationMinutes: 60, guestCount: 1, meetingLocation: 'JBR Beach', bookingStatus: 'Ready', adminStatus: 'Confirmed', managerStatus: 'Ready', assignedManagerId: 'manager-1', assignedManagerName: 'Mohammed Ali', assignedVehicleId: 'JS-01', assignedVehicleName: 'Yamaha FX Cruiser HO', captainName: '', driverRequired: false, driverName: '', rideStartTime: '', rideEndTime: '', extraTimeMinutes: 0, customerArrived: true, damageReported: false, damageNote: '', managerNote: 'Safety briefing completed.', internalNote: '', customerNote: '', totalAmount: 650, discountAmount: 0, finalAmount: 650, amountReceived: 0, amountPending: 650, paymentStatus: 'Unpaid', paymentMethod: 'Cash', paymentReceivedBy: '', paymentCollectedBy: '', collectionStatus: 'Pending Collection', paymentNotes: '', source: 'Website', createdAt: '2026-07-01T08:30:00+04:00', updatedAt: '2026-07-02T17:40:00+04:00', activity: [activity('a-10233-1', 'Booking created from website', 'Website', 'customer', '2026-07-01T08:30:00+04:00'), activity('a-10233-2', 'Admin confirmed booking', 'Leena Park', 'admin', '2026-07-01T09:00:00+04:00'), activity('a-10233-3', 'Manager set ride Ready', 'Mohammed Ali', 'booking_manager', '2026-07-02T17:40:00+04:00')]
  },
  {
    id: '10232', bookingCode: 'BK-10232', customerName: 'Sara Johnson', customerPhone: '+971 54 765 4321', customerEmail: 'sara@example.com', serviceType: 'Jet Ski', vehicleType: 'jet_ski', preferredDate: '2026-07-03', preferredTime: '10:00', durationMinutes: 60, guestCount: 2, meetingLocation: 'Bluewaters', bookingStatus: 'Rescheduled', adminStatus: 'Rescheduled', managerStatus: null, assignedManagerId: null, assignedManagerName: null, assignedVehicleId: null, assignedVehicleName: null, captainName: '', driverRequired: true, driverName: '', rideStartTime: '', rideEndTime: '', extraTimeMinutes: 0, customerArrived: false, damageReported: false, damageNote: '', managerNote: '', internalNote: 'Moved from July 2.', customerNote: 'Morning slot preferred.', totalAmount: 720, discountAmount: 0, finalAmount: 720, amountReceived: 0, amountPending: 720, paymentStatus: 'Unpaid', paymentMethod: 'Cash', paymentReceivedBy: '', paymentCollectedBy: '', collectionStatus: 'Pending Collection', paymentNotes: '', source: 'Website', createdAt: '2026-06-30T14:30:00+04:00', updatedAt: '2026-07-01T13:15:00+04:00', activity: [activity('a-10232-1', 'Booking created from website', 'Website', 'customer', '2026-06-30T14:30:00+04:00'), activity('a-10232-2', 'Booking rescheduled', 'Leena Park', 'admin', '2026-07-01T13:15:00+04:00', 'Moved to July 3 at 10:00 AM.')]
  },
  {
    id: '10231', bookingCode: 'BK-10231', customerName: 'Khalid Rahman', customerPhone: '+971 58 654 3210', customerEmail: 'khalid@example.com', serviceType: 'Jet Ski', vehicleType: 'jet_ski', preferredDate: '2026-07-01', preferredTime: '09:30', durationMinutes: 60, guestCount: 1, meetingLocation: 'Dubai Marina', bookingStatus: 'Completed', adminStatus: 'Confirmed', managerStatus: 'Completed', assignedManagerId: 'manager-1', assignedManagerName: 'Mohammed Ali', assignedVehicleId: 'JS-01', assignedVehicleName: 'Yamaha FX Cruiser HO', captainName: '', driverRequired: false, driverName: '', rideStartTime: '2026-07-01T09:32', rideEndTime: '2026-07-01T10:38', extraTimeMinutes: 6, customerArrived: true, damageReported: false, damageNote: '', managerNote: 'Ride completed without issue.', internalNote: '', customerNote: '', totalAmount: 650, discountAmount: 0, finalAmount: 650, amountReceived: 650, amountPending: 0, paymentStatus: 'Paid', paymentMethod: 'Card', paymentReceivedBy: 'Leena Park', paymentCollectedBy: 'Admin', collectionStatus: 'Verified by Finance', paymentNotes: 'Card receipt filed.', source: 'Walk-in', createdAt: '2026-06-30T11:00:00+04:00', updatedAt: '2026-07-01T10:40:00+04:00', activity: [activity('a-10231-1', 'Booking created', 'Leena Park', 'admin', '2026-06-30T11:00:00+04:00'), activity('a-10231-2', 'Manager marked Completed', 'Mohammed Ali', 'booking_manager', '2026-07-01T10:40:00+04:00', 'No damage reported.')]
  }
];

export const formatAed = (value: number) => `AED ${Math.round(value).toLocaleString('en-AE')}`;
export const formatBookingDate = (value: string) => new Intl.DateTimeFormat('en-AE', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
export const formatTime = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return new Intl.DateTimeFormat('en-AE', { hour: 'numeric', minute: '2-digit' }).format(new Date(2026, 0, 1, hours, minutes));
};
