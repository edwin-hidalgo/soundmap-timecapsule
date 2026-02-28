/**
 * COUNTRY_DATA
 *
 * Lookup table: ISO 3166-1 alpha-2 → { lat, lng, name }
 * Approximately geographic center of each country.
 * Includes special codes: ZZ (Unknown/Private Network), A1 (VPN/Anonymous Proxy)
 *
 * Organized by region. ~253 total entries.
 *
 * Used by:
 *   - parseStreamingHistory.js to attach coordinates to country stats
 *   - MapView.jsx to position <Marker> components
 *   - MapView.jsx to compute fitBounds on initial load
 */
export const COUNTRY_DATA = {
  // ─────────────────────────────────────────────────────────────────────────
  // Special codes
  // ─────────────────────────────────────────────────────────────────────────
  ZZ: { lat: 0,     lng: 0,      name: 'Unknown / Private Network' },
  A1: { lat: 0,     lng: 0,      name: 'VPN / Anonymous Proxy' },

  // ─────────────────────────────────────────────────────────────────────────
  // Africa (54 countries)
  // ─────────────────────────────────────────────────────────────────────────
  DZ: { lat: 28.0,  lng: 3.0,    name: 'Algeria' },
  AO: { lat: -11.2, lng: 17.9,   name: 'Angola' },
  BJ: { lat: 9.3,   lng: 2.3,    name: 'Benin' },
  BW: { lat: -22.3, lng: 24.7,   name: 'Botswana' },
  BF: { lat: 12.4,  lng: -1.6,   name: 'Burkina Faso' },
  BI: { lat: -3.4,  lng: 29.9,   name: 'Burundi' },
  CV: { lat: 16.0,  lng: -24.0,  name: 'Cape Verde' },
  CM: { lat: 3.9,   lng: 11.5,   name: 'Cameroon' },
  CF: { lat: 6.6,   lng: 20.9,   name: 'Central African Republic' },
  TD: { lat: 15.5,  lng: 18.7,   name: 'Chad' },
  KM: { lat: -11.6, lng: 43.3,   name: 'Comoros' },
  CG: { lat: -0.2,  lng: 15.8,   name: 'Republic of the Congo' },
  CD: { lat: -4.0,  lng: 21.8,   name: 'DR Congo' },
  DJ: { lat: 11.8,  lng: 42.6,   name: 'Djibouti' },
  EG: { lat: 26.8,  lng: 30.8,   name: 'Egypt' },
  GQ: { lat: 1.7,   lng: 10.3,   name: 'Equatorial Guinea' },
  ER: { lat: 15.2,  lng: 39.8,   name: 'Eritrea' },
  SZ: { lat: -26.5, lng: 31.5,   name: 'Eswatini' },
  ET: { lat: 9.1,   lng: 40.5,   name: 'Ethiopia' },
  GA: { lat: -0.8,  lng: 11.6,   name: 'Gabon' },
  GM: { lat: 13.4,  lng: -15.3,  name: 'Gambia' },
  GH: { lat: 7.9,   lng: -1.0,   name: 'Ghana' },
  GN: { lat: 10.0,  lng: -11.0,  name: 'Guinea' },
  GW: { lat: 11.8,  lng: -15.2,  name: 'Guinea-Bissau' },
  CI: { lat: 7.5,   lng: -5.5,   name: "Côte d'Ivoire" },
  KE: { lat: 0.0,   lng: 37.9,   name: 'Kenya' },
  LS: { lat: -29.6, lng: 28.2,   name: 'Lesotho' },
  LR: { lat: 6.4,   lng: -9.4,   name: 'Liberia' },
  LY: { lat: 26.3,  lng: 17.2,   name: 'Libya' },
  MG: { lat: -18.8, lng: 46.9,   name: 'Madagascar' },
  MW: { lat: -13.3, lng: 34.3,   name: 'Malawi' },
  ML: { lat: 17.6,  lng: -4.0,   name: 'Mali' },
  MR: { lat: 21.0,  lng: -10.9,  name: 'Mauritania' },
  MU: { lat: -20.3, lng: 57.6,   name: 'Mauritius' },
  MA: { lat: 31.8,  lng: -7.1,   name: 'Morocco' },
  MZ: { lat: -18.7, lng: 35.5,   name: 'Mozambique' },
  NA: { lat: -22.0, lng: 17.1,   name: 'Namibia' },
  NE: { lat: 17.6,  lng: 8.1,    name: 'Niger' },
  NG: { lat: 9.1,   lng: 8.7,    name: 'Nigeria' },
  RW: { lat: -1.9,  lng: 29.9,   name: 'Rwanda' },
  ST: { lat: 0.2,   lng: 6.6,    name: 'Sao Tome and Principe' },
  SN: { lat: 14.5,  lng: -14.5,  name: 'Senegal' },
  SC: { lat: -4.7,  lng: 55.5,   name: 'Seychelles' },
  SL: { lat: 8.5,   lng: -11.8,  name: 'Sierra Leone' },
  SO: { lat: 5.2,   lng: 46.2,   name: 'Somalia' },
  ZA: { lat: -30.6, lng: 22.9,   name: 'South Africa' },
  SS: { lat: 6.9,   lng: 31.3,   name: 'South Sudan' },
  SD: { lat: 12.9,  lng: 30.2,   name: 'Sudan' },
  TZ: { lat: -6.4,  lng: 34.9,   name: 'Tanzania' },
  TG: { lat: 8.6,   lng: 0.8,    name: 'Togo' },
  TN: { lat: 33.9,  lng: 9.5,    name: 'Tunisia' },
  UG: { lat: 1.4,   lng: 32.3,   name: 'Uganda' },
  ZM: { lat: -13.1, lng: 27.8,   name: 'Zambia' },
  ZW: { lat: -19.0, lng: 29.2,   name: 'Zimbabwe' },

  // ─────────────────────────────────────────────────────────────────────────
  // Americas — North & Central (23 countries)
  // ─────────────────────────────────────────────────────────────────────────
  AG: { lat: 17.1,  lng: -61.8,  name: 'Antigua and Barbuda' },
  BS: { lat: 25.0,  lng: -77.4,  name: 'Bahamas' },
  BB: { lat: 13.2,  lng: -59.6,  name: 'Barbados' },
  BZ: { lat: 17.2,  lng: -88.5,  name: 'Belize' },
  CA: { lat: 56.1,  lng: -106.3, name: 'Canada' },
  CR: { lat: 9.7,   lng: -83.8,  name: 'Costa Rica' },
  CU: { lat: 22.0,  lng: -80.0,  name: 'Cuba' },
  DM: { lat: 15.4,  lng: -61.4,  name: 'Dominica' },
  DO: { lat: 18.7,  lng: -70.2,  name: 'Dominican Republic' },
  SV: { lat: 13.8,  lng: -88.9,  name: 'El Salvador' },
  GD: { lat: 12.1,  lng: -61.7,  name: 'Grenada' },
  GT: { lat: 15.8,  lng: -90.2,  name: 'Guatemala' },
  HT: { lat: 19.0,  lng: -72.3,  name: 'Haiti' },
  HN: { lat: 15.2,  lng: -86.2,  name: 'Honduras' },
  JM: { lat: 18.1,  lng: -77.3,  name: 'Jamaica' },
  MX: { lat: 23.6,  lng: -102.5, name: 'Mexico' },
  NI: { lat: 12.9,  lng: -85.2,  name: 'Nicaragua' },
  PA: { lat: 8.6,   lng: -80.8,  name: 'Panama' },
  KN: { lat: 17.3,  lng: -62.7,  name: 'Saint Kitts and Nevis' },
  LC: { lat: 13.9,  lng: -60.9,  name: 'Saint Lucia' },
  VC: { lat: 13.3,  lng: -61.2,  name: 'Saint Vincent and the Grenadines' },
  TT: { lat: 10.7,  lng: -61.2,  name: 'Trinidad and Tobago' },
  US: { lat: 39.8,  lng: -98.5,  name: 'United States' },

  // ─────────────────────────────────────────────────────────────────────────
  // Americas — South (12 countries)
  // ─────────────────────────────────────────────────────────────────────────
  AR: { lat: -38.4, lng: -63.6,  name: 'Argentina' },
  BO: { lat: -16.3, lng: -64.0,  name: 'Bolivia' },
  BR: { lat: -14.2, lng: -51.9,  name: 'Brazil' },
  CL: { lat: -35.7, lng: -71.5,  name: 'Chile' },
  CO: { lat: 4.6,   lng: -74.1,  name: 'Colombia' },
  EC: { lat: -1.8,  lng: -78.2,  name: 'Ecuador' },
  GY: { lat: 4.9,   lng: -59.0,  name: 'Guyana' },
  PY: { lat: -23.4, lng: -58.4,  name: 'Paraguay' },
  PE: { lat: -9.2,  lng: -75.0,  name: 'Peru' },
  SR: { lat: 3.9,   lng: -56.0,  name: 'Suriname' },
  UY: { lat: -32.5, lng: -55.8,  name: 'Uruguay' },
  VE: { lat: 6.4,   lng: -66.6,  name: 'Venezuela' },

  // ─────────────────────────────────────────────────────────────────────────
  // Asia — East (6 countries)
  // ─────────────────────────────────────────────────────────────────────────
  CN: { lat: 35.9,  lng: 104.2,  name: 'China' },
  JP: { lat: 36.2,  lng: 138.3,  name: 'Japan' },
  MN: { lat: 46.9,  lng: 103.8,  name: 'Mongolia' },
  KP: { lat: 40.3,  lng: 127.5,  name: 'North Korea' },
  KR: { lat: 35.9,  lng: 127.8,  name: 'South Korea' },
  TW: { lat: 23.7,  lng: 121.0,  name: 'Taiwan' },

  // ─────────────────────────────────────────────────────────────────────────
  // Asia — South (8 countries)
  // ─────────────────────────────────────────────────────────────────────────
  AF: { lat: 33.9,  lng: 67.7,   name: 'Afghanistan' },
  BD: { lat: 23.7,  lng: 90.4,   name: 'Bangladesh' },
  BT: { lat: 27.5,  lng: 90.4,   name: 'Bhutan' },
  IN: { lat: 20.6,  lng: 78.9,   name: 'India' },
  MV: { lat: 3.2,   lng: 73.2,   name: 'Maldives' },
  NP: { lat: 28.4,  lng: 84.1,   name: 'Nepal' },
  PK: { lat: 30.4,  lng: 69.3,   name: 'Pakistan' },
  LK: { lat: 7.9,   lng: 80.8,   name: 'Sri Lanka' },

  // ─────────────────────────────────────────────────────────────────────────
  // Asia — Southeast (11 countries)
  // ─────────────────────────────────────────────────────────────────────────
  BN: { lat: 4.5,   lng: 114.7,  name: 'Brunei' },
  KH: { lat: 12.6,  lng: 104.9,  name: 'Cambodia' },
  ID: { lat: -2.5,  lng: 113.6,  name: 'Indonesia' },
  LA: { lat: 19.9,  lng: 102.5,  name: 'Laos' },
  MY: { lat: 4.2,   lng: 109.5,  name: 'Malaysia' },
  MM: { lat: 21.9,  lng: 95.9,   name: 'Myanmar' },
  PH: { lat: 12.9,  lng: 121.8,  name: 'Philippines' },
  SG: { lat: 1.4,   lng: 103.8,  name: 'Singapore' },
  TH: { lat: 15.9,  lng: 100.9,  name: 'Thailand' },
  TL: { lat: -8.9,  lng: 125.7,  name: 'Timor-Leste' },
  VN: { lat: 14.1,  lng: 108.3,  name: 'Vietnam' },

  // ─────────────────────────────────────────────────────────────────────────
  // Asia — West / Middle East (18 countries)
  // ─────────────────────────────────────────────────────────────────────────
  AM: { lat: 40.1,  lng: 45.0,   name: 'Armenia' },
  AZ: { lat: 40.1,  lng: 47.6,   name: 'Azerbaijan' },
  BH: { lat: 26.0,  lng: 50.6,   name: 'Bahrain' },
  CY: { lat: 35.1,  lng: 33.4,   name: 'Cyprus' },
  GE: { lat: 42.3,  lng: 43.4,   name: 'Georgia' },
  IR: { lat: 32.4,  lng: 53.7,   name: 'Iran' },
  IQ: { lat: 33.2,  lng: 43.7,   name: 'Iraq' },
  IL: { lat: 31.0,  lng: 35.0,   name: 'Israel' },
  JO: { lat: 30.6,  lng: 36.8,   name: 'Jordan' },
  KW: { lat: 29.3,  lng: 47.5,   name: 'Kuwait' },
  LB: { lat: 33.9,  lng: 35.9,   name: 'Lebanon' },
  OM: { lat: 21.5,  lng: 57.0,   name: 'Oman' },
  PS: { lat: 31.9,  lng: 35.3,   name: 'Palestine' },
  QA: { lat: 25.4,  lng: 51.2,   name: 'Qatar' },
  SA: { lat: 23.9,  lng: 45.1,   name: 'Saudi Arabia' },
  SY: { lat: 34.8,  lng: 38.9,   name: 'Syria' },
  AE: { lat: 24.2,  lng: 53.9,   name: 'United Arab Emirates' },
  YE: { lat: 15.6,  lng: 48.5,   name: 'Yemen' },

  // ─────────────────────────────────────────────────────────────────────────
  // Asia — Central (5 countries)
  // ─────────────────────────────────────────────────────────────────────────
  KZ: { lat: 48.0,  lng: 66.9,   name: 'Kazakhstan' },
  KG: { lat: 41.2,  lng: 74.8,   name: 'Kyrgyzstan' },
  TJ: { lat: 38.9,  lng: 71.3,   name: 'Tajikistan' },
  TM: { lat: 40.0,  lng: 59.6,   name: 'Turkmenistan' },
  UZ: { lat: 41.4,  lng: 64.6,   name: 'Uzbekistan' },

  // ─────────────────────────────────────────────────────────────────────────
  // Europe (47 countries)
  // ─────────────────────────────────────────────────────────────────────────
  AL: { lat: 41.2,  lng: 20.2,   name: 'Albania' },
  AD: { lat: 42.5,  lng: 1.5,    name: 'Andorra' },
  AT: { lat: 47.5,  lng: 14.5,   name: 'Austria' },
  BY: { lat: 53.7,  lng: 28.0,   name: 'Belarus' },
  BE: { lat: 50.8,  lng: 4.5,    name: 'Belgium' },
  BA: { lat: 44.2,  lng: 17.7,   name: 'Bosnia and Herzegovina' },
  BG: { lat: 42.7,  lng: 25.5,   name: 'Bulgaria' },
  HR: { lat: 45.1,  lng: 15.2,   name: 'Croatia' },
  CZ: { lat: 49.8,  lng: 15.5,   name: 'Czech Republic' },
  DK: { lat: 56.3,  lng: 9.5,    name: 'Denmark' },
  EE: { lat: 58.6,  lng: 25.0,   name: 'Estonia' },
  FI: { lat: 64.0,  lng: 26.0,   name: 'Finland' },
  FR: { lat: 46.2,  lng: 2.2,    name: 'France' },
  DE: { lat: 51.2,  lng: 10.4,   name: 'Germany' },
  GR: { lat: 39.1,  lng: 22.0,   name: 'Greece' },
  HU: { lat: 47.2,  lng: 19.5,   name: 'Hungary' },
  IS: { lat: 65.0,  lng: -18.5,  name: 'Iceland' },
  IE: { lat: 53.4,  lng: -8.2,   name: 'Ireland' },
  IT: { lat: 41.9,  lng: 12.6,   name: 'Italy' },
  XK: { lat: 42.6,  lng: 20.9,   name: 'Kosovo' },
  LV: { lat: 57.0,  lng: 24.8,   name: 'Latvia' },
  LI: { lat: 47.2,  lng: 9.6,    name: 'Liechtenstein' },
  LT: { lat: 56.0,  lng: 24.0,   name: 'Lithuania' },
  LU: { lat: 49.8,  lng: 6.1,    name: 'Luxembourg' },
  MT: { lat: 35.9,  lng: 14.4,   name: 'Malta' },
  MD: { lat: 47.4,  lng: 28.4,   name: 'Moldova' },
  MC: { lat: 43.7,  lng: 7.4,    name: 'Monaco' },
  ME: { lat: 42.7,  lng: 19.4,   name: 'Montenegro' },
  NL: { lat: 52.1,  lng: 5.3,    name: 'Netherlands' },
  MK: { lat: 41.6,  lng: 21.7,   name: 'North Macedonia' },
  NO: { lat: 60.5,  lng: 8.5,    name: 'Norway' },
  PL: { lat: 51.9,  lng: 19.1,   name: 'Poland' },
  PT: { lat: 39.4,  lng: -8.2,   name: 'Portugal' },
  RO: { lat: 45.9,  lng: 24.9,   name: 'Romania' },
  RU: { lat: 61.5,  lng: 105.3,  name: 'Russia' },
  SM: { lat: 43.9,  lng: 12.5,   name: 'San Marino' },
  RS: { lat: 44.0,  lng: 21.0,   name: 'Serbia' },
  SK: { lat: 48.7,  lng: 19.7,   name: 'Slovakia' },
  SI: { lat: 46.2,  lng: 15.0,   name: 'Slovenia' },
  ES: { lat: 40.5,  lng: -3.7,   name: 'Spain' },
  SE: { lat: 60.1,  lng: 18.6,   name: 'Sweden' },
  CH: { lat: 46.8,  lng: 8.2,    name: 'Switzerland' },
  TR: { lat: 38.9,  lng: 35.2,   name: 'Turkey' },
  UA: { lat: 48.4,  lng: 31.2,   name: 'Ukraine' },
  GB: { lat: 55.3,  lng: -3.4,   name: 'United Kingdom' },
  VA: { lat: 41.9,  lng: 12.5,   name: 'Vatican City' },

  // ─────────────────────────────────────────────────────────────────────────
  // Oceania (14 countries)
  // ─────────────────────────────────────────────────────────────────────────
  AU: { lat: -25.3, lng: 133.8,  name: 'Australia' },
  FJ: { lat: -17.7, lng: 178.1,  name: 'Fiji' },
  KI: { lat: 1.9,   lng: -157.4, name: 'Kiribati' },
  MH: { lat: 7.1,   lng: 171.2,  name: 'Marshall Islands' },
  FM: { lat: 6.9,   lng: 158.2,  name: 'Micronesia' },
  NR: { lat: -0.5,  lng: 166.9,  name: 'Nauru' },
  NZ: { lat: -40.9, lng: 174.9,  name: 'New Zealand' },
  PW: { lat: 7.5,   lng: 134.6,  name: 'Palau' },
  PG: { lat: -6.3,  lng: 143.9,  name: 'Papua New Guinea' },
  WS: { lat: -13.8, lng: -172.1, name: 'Samoa' },
  SB: { lat: -9.6,  lng: 160.2,  name: 'Solomon Islands' },
  TO: { lat: -21.2, lng: -175.2, name: 'Tonga' },
  TV: { lat: -7.5,  lng: 178.7,  name: 'Tuvalu' },
  VU: { lat: -15.4, lng: 166.9,  name: 'Vanuatu' },
}
