// Birthday fun facts, Zodiac, Indian seasons, Birthday Paradox, and BirthdayTraffic-inspired statistics

export interface ZodiacInfo {
  sign: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  trait: string;
  color: string;
}

export interface SeasonInfo {
  name: string;
  ritu: string;
  description: string;
  trend: string;
}

export interface BirthdayParadoxInfo {
  roomSizeForMatch: number;
  classicParadoxRoomSize: number;
  twinProbabilityIn100People: string;
}

export interface BenchmarkComparison {
  dateName: string;
  subtitle: string;
  annualBirths: number;
  relativeFreq: number;
  ratioToUser: string;
  barPercent: number; // relative to maximum
}

export interface ExtremeDateItem {
  rank: number;
  date: string;
  mmdd: string;
  label: string;
  approxBirths: string;
}

export function getZodiacInfo(month: number, day: number): ZodiacInfo {
  const dates = [
    { m: 1, d: 20, sign: 'Capricorn', element: 'Earth', trait: 'Ambitious & Grounded', color: '#E8F5E9' },
    { m: 2, d: 19, sign: 'Aquarius', element: 'Air', trait: 'Innovative & Independent', color: '#E1F5FE' },
    { m: 3, d: 21, sign: 'Pisces', element: 'Water', trait: 'Intuitive & Compassionate', color: '#EDE7F6' },
    { m: 4, d: 20, sign: 'Aries', element: 'Fire', trait: 'Bold & Dynamic', color: '#FCE4EC' },
    { m: 5, d: 21, sign: 'Taurus', element: 'Earth', trait: 'Patient & Reliable', color: '#E8F5E9' },
    { m: 6, d: 21, sign: 'Gemini', element: 'Air', trait: 'Curious & Expressive', color: '#FFF9C4' },
    { m: 7, d: 23, sign: 'Cancer', element: 'Water', trait: 'Nurturing & Empathetic', color: '#E1F5FE' },
    { m: 8, d: 23, sign: 'Leo', element: 'Fire', trait: 'Radiant & Warm-hearted', color: '#FFF3E0' },
    { m: 9, d: 23, sign: 'Virgo', element: 'Earth', trait: 'Meticulous & Thoughtful', color: '#E8F5E9' },
    { m: 10, d: 23, sign: 'Libra', element: 'Air', trait: 'Harmonious & Charming', color: '#EDE7F6' },
    { m: 11, d: 22, sign: 'Scorpio', element: 'Water', trait: 'Passionate & Insightful', color: '#FCE4EC' },
    { m: 12, d: 22, sign: 'Sagittarius', element: 'Fire', trait: 'Adventurous & Optimistic', color: '#FFF3E0' },
  ];

  for (const z of dates) {
    if (month < z.m || (month === z.m && day < z.d)) {
      return z as ZodiacInfo;
    }
  }
  return dates[0] as ZodiacInfo;
}

export function getSeasonInfo(month: number): SeasonInfo {
  switch (month) {
    case 12:
    case 1:
      return {
        name: 'Winter',
        ritu: 'Shishira (Late Winter)',
        description: 'Crisp mornings and cozy celebrations.',
        trend: 'Moderate birth rate window across India.',
      };
    case 2:
    case 3:
      return {
        name: 'Spring',
        ritu: 'Vasanta (Spring)',
        description: 'Blooming flowers, vibrant festivals, and pleasant breezes.',
        trend: 'Historically the highest birth concentration in India (March 1st is national peak).',
      };
    case 4:
    case 5:
      return {
        name: 'Summer',
        ritu: 'Grishma (Summer)',
        description: 'Sun-drenched days, mango season, and warmth.',
        trend: 'Steady birth volume with high activity in early summer.',
      };
    case 6:
    case 7:
    case 8:
      return {
        name: 'Monsoon',
        ritu: 'Varsha (Monsoon)',
        description: 'Nourishing rains, lush greenery, and festive homecoming.',
        trend: 'Notable dip towards late August, making late monsoon dates especially rare.',
      };
    case 9:
    case 10:
      return {
        name: 'Autumn',
        ritu: 'Sharad (Autumn)',
        description: 'Clear azure skies and golden sunset hues.',
        trend: 'Second annual baby boom window across many states.',
      };
    case 11:
    default:
      return {
        name: 'Pre-Winter',
        ritu: 'Hemanta (Early Winter)',
        description: 'Chilly evenings, festival of lights, and family gatherings.',
        trend: 'Balanced, steady birth distribution across northern and southern India.',
      };
  }
}

export function getBirthdayParadoxInfo(isLeapDay: boolean): BirthdayParadoxInfo {
  const roomSize = isLeapDay ? 1013 : 253;
  const classic = 23;
  const probIn100 = isLeapDay ? '6.6%' : '24.0%';

  return {
    roomSizeForMatch: roomSize,
    classicParadoxRoomSize: classic,
    twinProbabilityIn100People: probIn100,
  };
}

// Calculate dynamic probabilities for interactive crowd slider (10 to 500 people)
export function calculateCrowdProbabilities(crowdSize: number, isLeapDay: boolean): {
  userMatchPercent: number;
  anyMatchPercent: number;
} {
  const daysInYear = isLeapDay ? 1461 : 365;
  
  // Probability that at least one person in crowd matches the USER's specific birthday
  const userMatchProb = 1 - Math.pow((daysInYear - 1) / daysInYear, crowdSize);
  const userMatchPercent = Math.min(100, Math.max(0, Math.round(userMatchProb * 1000) / 10));

  // Probability that ANY two people in the crowd share a birthday (Classic Paradox)
  let anyMatchProb = 0;
  if (crowdSize >= 365) {
    anyMatchProb = 1.0;
  } else {
    let p = 1.0;
    for (let i = 0; i < crowdSize; i++) {
      p *= (365 - i) / 365;
    }
    anyMatchProb = 1 - p;
  }
  const anyMatchPercent = Math.min(100, Math.max(0, Math.round(anyMatchProb * 1000) / 10));

  return { userMatchPercent, anyMatchPercent };
}

// Benchmark comparisons: User Date vs March 1 (Peak), Aug 31 (Annual Low), Feb 29 (Leap)
export function getBenchmarkComparisons(userAnnualBirths: number, userFormattedDate: string): BenchmarkComparison[] {
  const peakBirths = 78920; // 1 March (National Peak)
  const lowestAnnualBirths = 58150; // 31 August (Least Common Regular Date)
  const leapDayBirths = 15280; // 29 February (Leap Day)

  const maxVal = Math.max(peakBirths, userAnnualBirths);

  return [
    {
      dateName: userFormattedDate,
      subtitle: 'Your birthday',
      annualBirths: userAnnualBirths,
      relativeFreq: 1.0,
      ratioToUser: '1.0×',
      barPercent: Math.round((userAnnualBirths / maxVal) * 100),
    },
    {
      dateName: '1 March',
      subtitle: 'National Peak',
      annualBirths: peakBirths,
      relativeFreq: 1.15,
      ratioToUser: (peakBirths / userAnnualBirths).toFixed(1) + '×',
      barPercent: Math.round((peakBirths / maxVal) * 100),
    },
    {
      dateName: '31 August',
      subtitle: 'Annual Low',
      annualBirths: lowestAnnualBirths,
      relativeFreq: 0.85,
      ratioToUser: (lowestAnnualBirths / userAnnualBirths).toFixed(1) + '×',
      barPercent: Math.round((lowestAnnualBirths / maxVal) * 100),
    },
    {
      dateName: '29 February',
      subtitle: 'Leap Day',
      annualBirths: leapDayBirths,
      relativeFreq: 0.25,
      ratioToUser: (leapDayBirths / userAnnualBirths).toFixed(2) + '×',
      barPercent: Math.round((leapDayBirths / maxVal) * 100),
    },
  ];
}

// Top 5 Rarest vs Top 5 Most Common Dates in India
export const TOP_RAREST_DATES: ExtremeDateItem[] = [
  { rank: 1, date: '29 February', mmdd: '02-29', label: 'Leap Day', approxBirths: '~15,280 / yr' },
  { rank: 2, date: '31 August', mmdd: '08-31', label: 'Annual Low', approxBirths: '~58,150 / yr' },
  { rank: 3, date: '30 August', mmdd: '08-30', label: 'Late August', approxBirths: '~58,420 / yr' },
  { rank: 4, date: '29 August', mmdd: '08-29', label: 'Late August', approxBirths: '~58,800 / yr' },
  { rank: 5, date: '28 August', mmdd: '08-28', label: 'Late August', approxBirths: '~59,100 / yr' },
];

export const TOP_COMMON_DATES: ExtremeDateItem[] = [
  { rank: 366, date: '1 March', mmdd: '03-01', label: 'National Peak', approxBirths: '~78,920 / yr' },
  { rank: 365, date: '2 March', mmdd: '03-02', label: 'Early March', approxBirths: '~78,400 / yr' },
  { rank: 364, date: '3 March', mmdd: '03-03', label: 'Early March', approxBirths: '~77,900 / yr' },
  { rank: 363, date: '28 February', mmdd: '02-28', label: 'Late February', approxBirths: '~77,200 / yr' },
  { rank: 362, date: '1 January', mmdd: '01-01', label: 'New Year', approxBirths: '~76,800 / yr' },
];
