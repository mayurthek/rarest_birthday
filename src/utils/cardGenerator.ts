import type { BirthdayResult } from '../types/birthday';
import { getZodiacInfo, getSeasonInfo, getBirthdayParadoxInfo } from './birthdayFun';

/**
 * Generates a high-DPI 1:1 square card (1080x1080 px) on HTML5 Canvas
 * in clean Apple HIG typography and BirthdayTraffic styling.
 */
export async function generateShareCard(result: BirthdayResult): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  const zodiac = getZodiacInfo(result.month, result.day);
  const season = getSeasonInfo(result.month);
  const paradox = getBirthdayParadoxInfo(result.isLeapDay);

  // Background: Warm #FEF2DB Cream Canvas
  ctx.fillStyle = '#FEF2DB';
  ctx.fillRect(0, 0, 1080, 1080);

  // Top wordmark: "howrareisyourbirthday.fun"
  ctx.fillStyle = '#242728';
  ctx.font = '800 24px "Inter UI", "Inter", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '-0.02em';
  ctx.fillText('howrareisyourbirthday.fun', 540, 85);

  // Central Card Container: Dusty Rose Pink Envelope (#F0E2E7)
  ctx.fillStyle = '#F0E2E7';
  ctx.beginPath();
  ctx.roundRect(100, 130, 880, 820, 40);
  ctx.fill();

  // Top pill inside card: Category + Date
  const catW = 320;
  const catH = 46;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.roundRect(140, 170, catW, catH, 23);
  ctx.fill();

  ctx.fillStyle = '#7D4C5D';
  ctx.font = '800 14px "Inter UI", "Inter", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '0.08em';
  let catText = 'BALANCED BIRTHDAY';
  if (result.isLeapDay) catText = 'CALENDAR ANOMALY';
  else if (result.rarityRank <= 25) catText = 'TOP 25 RAREST DATES';
  else if (result.rarerThanPercent >= 65) catText = 'ON THE RARER SIDE';
  else if (result.rarerThanPercent >= 35) catText = 'POPULAR BIRTHDAY';
  else catText = 'PEAK BIRTHDAY SEASON';
  ctx.fillText(catText, 140 + catW / 2, 199);

  // Date pill on right
  const dateW = 280;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(980 - 140 - dateW, 170, dateW, catH, 23);
  ctx.fill();

  ctx.fillStyle = '#242728';
  ctx.font = '800 18px "Inter UI", "Inter", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '-0.02em';
  ctx.fillText(result.formattedDate, 980 - 140 - dateW / 2, 200);

  // HUGE PERCENTILE NUMBER
  ctx.fillStyle = '#242728';
  ctx.font = '900 180px "Inter UI", "Inter", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.letterSpacing = '-0.06em';
  ctx.textAlign = 'center';
  ctx.fillText(`${result.rarerThanPercent}%`, 540, 440);

  // PUNCHY HEADLINE
  ctx.fillStyle = '#242728';
  ctx.font = '800 36px "Inter UI", "Inter", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.letterSpacing = '-0.03em';
  ctx.fillText(`Rarer than ${result.rarerThanPercent}% of birthdays`, 540, 510);

  // 3 Sleek Key Stat Badges
  const chipW = 240;
  const chipH = 110;
  const chipY = 575;
  const gap = 25;
  const startX = (1080 - (3 * chipW + 2 * gap)) / 2;

  const chipsData = [
    { label: 'RARITY RANK', val: `#${result.rarityRank} / 366` },
    { label: 'DAILY BIRTHS', val: `~${result.averageAnnualBirths.toLocaleString('en-IN')}` },
    { label: 'ZODIAC', val: zodiac.sign },
  ];

  chipsData.forEach((chip, i) => {
    const x = startX + i * (chipW + gap);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x, chipY, chipW, chipH, 22);
    ctx.fill();

    ctx.fillStyle = '#8C586B';
    ctx.font = '800 14px "Inter UI", "Inter", -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.letterSpacing = '0.06em';
    ctx.fillText(chip.label, x + chipW / 2, chipY + 40);

    ctx.fillStyle = '#242728';
    ctx.font = '800 24px "Inter UI", "Inter", -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.letterSpacing = '-0.02em';
    ctx.fillText(chip.val, x + chipW / 2, chipY + 80);
  });

  // Cool twin crowd summary box
  const twinW = 770;
  const twinH = 90;
  const twinX = (1080 - twinW) / 2;
  const twinY = 720;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.roundRect(twinX, twinY, twinW, twinH, 20);
  ctx.fill();

  ctx.fillStyle = '#242728';
  ctx.font = '700 21px "Inter UI", "Inter", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.letterSpacing = '-0.01em';
  ctx.fillText(`Birthday Twin: Need ~${paradox.roomSizeForMatch} people for a 50% match`, 540, twinY + 42);

  ctx.fillStyle = '#7D4C5D';
  ctx.font = '500 17px "Inter UI", "Inter", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`Season: ${season.name} · ${season.ritu}`, 540, twinY + 70);

  // Watermark
  ctx.fillStyle = '#8C586B';
  ctx.font = '700 18px "Inter UI", "Inter", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.letterSpacing = '0.04em';
  ctx.fillText('howrareisyourbirthday.fun', 540, 890);

  return canvas.toDataURL('image/png');
}

export async function downloadShareCard(result: BirthdayResult): Promise<void> {
  const dataUrl = await generateShareCard(result);
  const link = document.createElement('a');
  link.download = `rarest-birthday-${result.birthday_mm_dd}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
