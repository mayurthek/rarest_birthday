export interface RawBirthdayRecord {
  birthday_mm_dd: string; // e.g. "01-01", "02-29"
  day: number;
  month: number;
  month_name: string;
  eligible_years: number;
  expected_births_in_window: number;
  average_births_per_eligible_year: number;
  relative_to_average_date: number;
  raw_rarity_rank: number; // 1 (most common) to 366 (least common in total births)
}

export interface BirthdayResult {
  birthday_mm_dd: string;
  day: number;
  month: number;
  monthName: string;
  formattedDate: string; // e.g. "23 September"
  eligibleYears: number;
  expectedBirths: number;
  averageAnnualBirths: number;
  relativeFrequency: number; // e.g. 1.093 or 0.870
  rawRank: number; // 1 = highest frequency (March 1), 366 = Feb 29
  rarityRank: number; // 1 = rarest, 366 = most common (367 - rawRank)
  rarerThanPercent: number; // 0% to 100%
  interpretation: string;
  tier: {
    label: string;
    badgeColor: string;
    textColor: string;
    bgGradient: string;
  };
  isLeapDay: boolean;
  spectrumPosition: number; // 0 (rarest) to 100 (most common)
}
