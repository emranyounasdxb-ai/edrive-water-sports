export const BOOKING_WORKFLOW_STEPS = [
  {
    id: 1,
    status: 'pending',
    owner: 'Customer / Website',
    title: 'Customer creates booking',
    description: 'Customer selects service, date, time, duration, and submits contact details from the website.'
  },
  {
    id: 2,
    status: 'pending',
    owner: 'Admin',
    title: 'Booking appears in pending queue',
    description: 'Admin reviews customer details, package, slot, coupon, and special notes.'
  },
  {
    id: 3,
    status: 'confirmed',
    owner: 'Admin',
    title: 'Admin confirms availability',
    description: 'Admin confirms the booking and sends it to the manager operations queue.'
  },
  {
    id: 4,
    status: 'checked_in',
    owner: 'Manager',
    title: 'Manager receives guest',
    description: 'Manager checks in the guest, verifies booking details, and prepares handover.'
  },
  {
    id: 5,
    status: 'in_progress',
    owner: 'Manager',
    title: 'Manager assigns vehicle',
    description: 'Manager selects the actual available Jet Ski or Jet Car and records handover details.'
  },
  {
    id: 6,
    status: 'completed',
    owner: 'Manager',
    title: 'Manager completes booking',
    description: 'Manager closes the ride and adds payment details before the booking moves to payments.'
  },
  {
    id: 7,
    status: 'paid_to_manager',
    owner: 'Payments',
    title: 'Direct collection remains with manager',
    description: 'Cash or card payment stays under manager collection until admin marks it received.'
  },
  {
    id: 8,
    status: 'pending_from_b2b_agent',
    owner: 'B2B Portal',
    title: 'B2B invoice goes to agent portal',
    description: 'B2B receivable is linked to the selected agent and appears in the agent portal and payments tab.'
  },
  {
    id: 9,
    status: 'settled',
    owner: 'Admin / Finance',
    title: 'Admin receives and settles payment',
    description: 'Admin receives manager cash/card collection or B2B agent payment and closes the receivable.'
  }
] as const;

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'checked_in',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
] as const;

export const PAYMENT_WORKFLOW_STATUSES = [
  'unpaid',
  'partial_paid',
  'paid_to_manager',
  'pending_from_b2b_agent',
  'received_by_admin',
  'settled',
  'refund_pending',
  'refunded'
] as const;

export const DIRECT_PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'online', label: 'Online' },
  { value: 'bank_transfer', label: 'Bank Transfer' }
] as const;

export const B2B_PAYMENT_METHOD = { value: 'b2b_agent', label: 'B2B Agent Invoice' } as const;
