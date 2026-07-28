const BUSINESS_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  booking_staff: 'Booking Manager',
  booking_manager: 'Booking Manager',
  manager: 'Ride Manager',
  maintenance_staff: 'Maintenance Staff',
  b2b_agent: 'B2B Agent',
  b2b_finance: 'B2B Finance',
  jet_ski: 'Jet Ski',
  jet_car: 'Jet Car',
  jet_ski_rental: 'Jet Ski Rental',
  jet_car_rental: 'Jet Car Rental',
  no_show: 'No Show',
  partial_paid: 'Partially Paid',
  partially_paid: 'Partially Paid',
  pending_collection: 'Pending Collection',
  partial_collection: 'Partially Collected',
  company_received: 'Received by Company',
  bank_transfer: 'Bank Transfer',
  finance_report_exported: 'Finance Report Exported',
  b2b: 'B2B',
  vat: 'VAT',
  aed: 'AED',
  id: 'ID',
  pdf: 'PDF',
  csv: 'CSV',
  uae: 'UAE'
};

const PRESERVED_WORDS: Record<string, string> = {
  b2b: 'B2B',
  vat: 'VAT',
  aed: 'AED',
  id: 'ID',
  pdf: 'PDF',
  csv: 'CSV',
  uae: 'UAE'
};

export function uiLabel(value: unknown, fallback = '-') {
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;
  const normalized = raw.replace(/[.\-\s]+/g, '_').replace(/_+/g, '_').toLowerCase();
  if (BUSINESS_LABELS[normalized]) return BUSINESS_LABELS[normalized];

  return normalized
    .split('_')
    .filter(Boolean)
    .map((word) => PRESERVED_WORDS[word] || `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')
    .replace(/\bJet Ski\b/g, 'Jet Ski')
    .replace(/\bJet Car\b/g, 'Jet Car');
}

type ErrorContext = 'load' | 'save' | 'permission' | 'network' | 'export' | 'delete' | 'upload';

export function safeUiError(error: unknown, context: ErrorContext = 'load') {
  const technical = error instanceof Error ? error.message : String(error ?? '');
  const normalized = technical.toLowerCase();

  if (/permission|not authorized|unauthorized|forbidden|row-level security|policy/.test(normalized)) {
    return 'You do not have permission to perform this action.';
  }
  if (/network|fetch|connection|timeout|offline|failed to connect/.test(normalized)) {
    return 'The connection was interrupted. Please try again.';
  }

  const messages: Record<ErrorContext, string> = {
    load: 'Unable to load the requested information. Please try again.',
    save: 'Your changes could not be saved. Please try again.',
    permission: 'You do not have permission to perform this action.',
    network: 'The connection was interrupted. Please try again.',
    export: 'The report could not be generated. Please try again.',
    delete: 'The item could not be removed. Please try again.',
    upload: 'The file could not be uploaded. Please try again.'
  };
  return messages[context];
}
