const fs = require('fs');
const path = require('path');

const summaryPath = path.join(__dirname, 'src', 'data', 'birthdaySummary.json');
const rawData = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

console.log(`Checking ${rawData.length} birthday records...`);

// 1. Check count
if (rawData.length !== 366) {
  console.error(`FAILED: Expected 366 records, found ${rawData.length}`);
  process.exit(1);
}

// 2. Check 02-29
const feb29 = rawData.find(r => r.birthday_mm_dd === '02-29');
if (!feb29) {
  console.error(`FAILED: 02-29 not found!`);
  process.exit(1);
}
if (feb29.eligible_years !== 4) {
  console.error(`FAILED: 02-29 should have 4 eligible years, got ${feb29.eligible_years}`);
  process.exit(1);
}
if (feb29.raw_rarity_rank !== 366) {
  console.error(`FAILED: 02-29 raw_rarity_rank should be 366, got ${feb29.raw_rarity_rank}`);
  process.exit(1);
}

// 3. Check March 1 (peak common date)
const mar1 = rawData.find(r => r.birthday_mm_dd === '03-01');
if (!mar1) {
  console.error(`FAILED: 03-01 not found!`);
  process.exit(1);
}
if (mar1.raw_rarity_rank !== 1) {
  console.error(`FAILED: 03-01 raw_rarity_rank should be 1, got ${mar1.raw_rarity_rank}`);
  process.exit(1);
}

// 4. Check Aug 31 (lowest non-leap date)
const aug31 = rawData.find(r => r.birthday_mm_dd === '08-31');
if (!aug31) {
  console.error(`FAILED: 08-31 not found!`);
  process.exit(1);
}
if (aug31.raw_rarity_rank !== 365) {
  console.error(`FAILED: 08-31 raw_rarity_rank should be 365, got ${aug31.raw_rarity_rank}`);
  process.exit(1);
}

// 5. Test formula across all dates
let maxPercent = -1;
let minPercent = 999;
rawData.forEach(r => {
  const rarerThanPercent = Math.round(((r.raw_rarity_rank - 1) / 365) * 100);
  if (rarerThanPercent < minPercent) minPercent = rarerThanPercent;
  if (rarerThanPercent > maxPercent) maxPercent = rarerThanPercent;
  const userRank = 367 - r.raw_rarity_rank;
  if (userRank < 1 || userRank > 366) {
    console.error(`FAILED: Invalid userRank ${userRank} for ${r.birthday_mm_dd}`);
    process.exit(1);
  }
});

console.log(`Percentile Range: min=${minPercent}%, max=${maxPercent}%`);
if (minPercent !== 0 || maxPercent !== 100) {
  console.error(`FAILED: Percentile should span 0% to 100%`);
  process.exit(1);
}

console.log('ALL 366 DATES VALIDATED SUCCESSFULLY! PASSED.');
