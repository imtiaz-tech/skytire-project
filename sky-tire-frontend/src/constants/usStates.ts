export const STATE_ABBREVIATIONS: Record<string, string> = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
  'District of Columbia': 'DC',
};

export const US_STATE_OPTIONS = Object.entries(STATE_ABBREVIATIONS).map(([name, abbr]) => ({
  name,
  abbr,
  label: `${name} (${abbr})`,
}));

export const ALL_STATE_ABBREVIATIONS = US_STATE_OPTIONS.map((s) => s.abbr);

export function filterStates(search: string) {
  const q = search.trim().toLowerCase();
  if (!q) return US_STATE_OPTIONS;
  return US_STATE_OPTIONS.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.abbr.toLowerCase().includes(q) ||
      s.abbr.toLowerCase() === q
  );
}

export function formatStateRestrictions(abbrs: string[]): string {
  if (abbrs.length === 0) return 'All States';
  if (abbrs.length === ALL_STATE_ABBREVIATIONS.length) return 'All States';
  return abbrs.join(', ');
}
