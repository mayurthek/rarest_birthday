import rawData from '../data/birthdaySummary.json';
import type { RawBirthdayRecord, BirthdayResult } from '../types/birthday';

const recordsMap = new Map<string, RawBirthdayRecord>();
let totalExpectedBirths = 0;

// Populate lookup map and compute aggregate births
(rawData as RawBirthdayRecord[]).forEach((rec) => {
  recordsMap.set(rec.birthday_mm_dd, rec);
  totalExpectedBirths += rec.expected_births_in_window;
});

export const TOTAL_EXPECTED_BIRTHS = totalExpectedBirths;

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function isValidDate(month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  const maxDay = DAYS_IN_MONTH[month - 1];
  return day >= 1 && day <= maxDay;
}

export function formatMMDD(month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${mm}-${dd}`;
}

export function parseMMDD(mmdd: string): { month: number; day: number } | null {
  const parts = mmdd.split('-');
  if (parts.length !== 2) return null;
  const m = parseInt(parts[0], 10);
  const d = parseInt(parts[1], 10);
  if (isNaN(m) || isNaN(d) || !isValidDate(m, d)) return null;
  return { month: m, day: d };
}

export function getBirthdayResult(month: number, day: number): BirthdayResult | null {
  if (!isValidDate(month, day)) {
    return null;
  }

  const key = formatMMDD(month, day);
  const record = recordsMap.get(key);
  if (!record) {
    return null;
  }

  const isLeapDay = month === 2 && day === 29;
  const formattedDate = `${day} ${record.month_name}`;

  // Raw rank from dataset: 1 (peak births / March 1) to 366 (lowest births / Feb 29)
  const rawRank = record.raw_rarity_rank;

  // PRD Semantics: Rank 1 is least common, Rank 366 is most common
  const rarityRank = 367 - rawRank;

  // User-facing percentile: percentage of birthdays in India that are MORE COMMON than yours
  // rawRank 1 (March 1) -> 0%
  // rawRank 365 (August 31) -> 100%
  // rawRank 366 (Feb 29) -> 100%
  let rarerThanPercent = Math.round(((rawRank - 1) / 365) * 100);
  rarerThanPercent = Math.max(0, Math.min(100, rarerThanPercent));

  // Spectrum position: 0% = rarest (less common), 100% = most common (peak)
  const spectrumPosition = Math.max(0, Math.min(100, 100 - rarerThanPercent));

  // Determine tier & interpretation
  let tier = {
    label: 'Balanced Birthday',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    textColor: 'text-emerald-700',
    bgGradient: 'from-emerald-500/10 to-teal-500/10',
  };

  let interpretation = '';

  if (isLeapDay) {
    tier = {
      label: 'Rare Leap Day Miracle',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      textColor: 'text-purple-800',
      bgGradient: 'from-purple-500/15 to-indigo-500/15',
    };
    interpretation =
      'A true calendar anomaly! Because 29 February occurs only in leap years, your birthday officially comes around once every 4 years.';
  } else if (rarerThanPercent >= 85) {
    tier = {
      label: 'Ultra Rare Date',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      textColor: 'text-amber-800',
      bgGradient: 'from-amber-500/15 to-orange-500/15',
    };
    interpretation =
      `You were born on ${formattedDate} — that puts your birthday in the rarest tier across India's modeled birth distribution!`;
  } else if (rarerThanPercent >= 55) {
    tier = {
      label: 'On the Rarer Side',
      badgeColor: 'bg-orange-50 text-orange-900 border-orange-200',
      textColor: 'text-orange-800',
      bgGradient: 'from-orange-500/15 to-amber-500/10',
    };
    interpretation =
      `Your birthday falls on the less common side of the India birthday spectrum. You share your day with fewer people than average.`;
  } else if (rarerThanPercent >= 25) {
    tier = {
      label: 'Common & Festive',
      badgeColor: 'bg-blue-50 text-blue-900 border-blue-200',
      textColor: 'text-blue-800',
      bgGradient: 'from-blue-500/10 to-indigo-500/10',
    };
    interpretation =
      `A popular and widely celebrated date! You share your special day with millions of fellow citizens across India.`;
  } else {
    tier = {
      label: 'Peak Birthday Season',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
      textColor: 'text-rose-800',
      bgGradient: 'from-rose-500/15 to-pink-500/10',
    };
    interpretation =
      `One of the most bustling birthday dates in the country! Your birthday lands in India's peak annual birth window.`;
  }

  // Exact empirical probability of a random person having this birthday
  const dailyProbability = record.expected_births_in_window / (TOTAL_EXPECTED_BIRTHS || 1);

  return {
    birthday_mm_dd: key,
    day,
    month,
    monthName: record.month_name,
    formattedDate,
    eligibleYears: record.eligible_years,
    expectedBirths: record.expected_births_in_window,
    averageAnnualBirths: record.average_births_per_eligible_year,
    relativeFrequency: record.relative_to_average_date,
    rawRank,
    rarityRank,
    rarerThanPercent,
    interpretation,
    tier,
    isLeapDay,
    spectrumPosition,
    dailyProbability,
  };
}

export function getAllRecords(): RawBirthdayRecord[] {
  return rawData as RawBirthdayRecord[];
}
