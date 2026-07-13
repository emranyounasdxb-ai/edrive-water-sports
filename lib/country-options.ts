export type CountryOption = {
  code: string;
  value: string;
  label: string;
};

const countryCodes = [
  'AF', 'AX', 'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AQ', 'AG', 'AR', 'AM', 'AW', 'AU', 'AT', 'AZ',
  'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BM', 'BT', 'BO', 'BQ', 'BA', 'BW', 'BV', 'BR',
  'IO', 'BN', 'BG', 'BF', 'BI', 'CV', 'KH', 'CM', 'CA', 'KY', 'CF', 'TD', 'CL', 'CN', 'CX', 'CC',
  'CO', 'KM', 'CG', 'CD', 'CK', 'CR', 'CI', 'HR', 'CU', 'CW', 'CY', 'CZ', 'DK', 'DJ', 'DM', 'DO',
  'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET', 'FK', 'FO', 'FJ', 'FI', 'FR', 'GF', 'PF', 'TF',
  'GA', 'GM', 'GE', 'DE', 'GH', 'GI', 'GR', 'GL', 'GD', 'GP', 'GU', 'GT', 'GG', 'GN', 'GW', 'GY',
  'HT', 'HM', 'VA', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IM', 'IL', 'IT', 'JM',
  'JP', 'JE', 'JO', 'KZ', 'KE', 'KI', 'KP', 'KR', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY',
  'LI', 'LT', 'LU', 'MO', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MQ', 'MR', 'MU', 'YT', 'MX',
  'FM', 'MD', 'MC', 'MN', 'ME', 'MS', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'NC', 'NZ', 'NI',
  'NE', 'NG', 'NU', 'NF', 'MK', 'MP', 'NO', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH',
  'PN', 'PL', 'PT', 'PR', 'QA', 'RE', 'RO', 'RU', 'RW', 'BL', 'SH', 'KN', 'LC', 'MF', 'PM', 'VC',
  'WS', 'SM', 'ST', 'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SX', 'SK', 'SI', 'SB', 'SO', 'ZA', 'GS',
  'SS', 'ES', 'LK', 'SD', 'SR', 'SJ', 'SE', 'CH', 'SY', 'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TK',
  'TO', 'TT', 'TN', 'TR', 'TM', 'TC', 'TV', 'UG', 'UA', 'AE', 'GB', 'US', 'UM', 'UY', 'UZ', 'VU',
  'VE', 'VN', 'VG', 'VI', 'WF', 'EH', 'YE', 'ZM', 'ZW', 'XK'
];

const priorityCountryCodes = [
  'AE', 'PK', 'IN', 'PH', 'NP', 'LK', 'BD', 'ID', 'DZ', 'EG', 'JO', 'SY', 'LB', 'MA', 'KE', 'UG', 'GH', 'NG', 'ET'
];

const fallbackNames: Record<string, string> = {
  AE: 'UAE',
  PS: 'Palestine',
  CD: 'Congo (DRC)',
  CG: 'Congo',
  CI: 'Ivory Coast',
  KR: 'South Korea',
  KP: 'North Korea',
  LA: 'Laos',
  RU: 'Russia',
  SY: 'Syria',
  TZ: 'Tanzania',
  US: 'United States',
  GB: 'United Kingdom',
  VN: 'Vietnam',
  XK: 'Kosovo'
};

function flagFromCode(code: string) {
  if (code.length !== 2) return '🌍';
  return code.toUpperCase().replace(/./g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)));
}

function countryName(code: string) {
  if (fallbackNames[code]) return fallbackNames[code];
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

function toOption(code: string): CountryOption {
  const value = countryName(code);
  return { code, value, label: `${flagFromCode(code)} ${value}` };
}

export const countryOptions: CountryOption[] = [
  ...priorityCountryCodes.map(toOption),
  ...countryCodes
    .filter((code) => !priorityCountryCodes.includes(code))
    .map(toOption)
    .sort((a, b) => a.value.localeCompare(b.value)),
  { code: 'OTHER', value: 'Other', label: '🌍 Other' }
];

export function countryOptionsForValue(currentValue: string | null | undefined) {
  const current = String(currentValue || '').trim();
  if (!current || countryOptions.some((option) => option.value === current)) return countryOptions;
  return [{ code: 'CURRENT', value: current, label: `🌍 ${current}` }, ...countryOptions];
}

export function countryFlag(value: string | null | undefined) {
  const clean = String(value || '').trim();
  if (!clean) return '🌍';
  if (clean === 'United Arab Emirates') return '🇦🇪';
  return countryOptions.find((option) => option.value === clean)?.label.split(' ')[0] || '🌍';
}
