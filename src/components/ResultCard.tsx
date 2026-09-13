import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw } from 'lucide-react';
import { toPng } from 'html-to-image';
import type { BirthdayResult } from '../types/birthday';
import { BirthdayCake } from './BirthdayCake';
import { dataURLtoFile, generateShareCard } from '../utils/cardGenerator';
import { trackEvent } from '../utils/analytics';
import {
  getZodiacInfo,
  getSeasonInfo,
  getBirthdayParadoxInfo,
  calculateCrowdProbabilities,
  getBenchmarkComparisons,
  TOP_RAREST_DATES,
  TOP_COMMON_DATES,
} from '../utils/birthdayFun';

interface ResultCardProps {
  result: BirthdayResult;
  onReset: () => void;
  onShowToast: (message: string) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onReset, onShowToast }) => {
  const cardRef = useRef<HTMLElement>(null);
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [cardMode, setCardMode] = useState<'classic' | 'stats'>('classic');
  
  // Interactive 50-50 Crowd slider state (default 23 people, classic paradox point)
  const [crowdSlider, setCrowdSlider] = useState<number>(23);

  // Secret stat foil scratch state
  const [isFoilRevealed, setIsFoilRevealed] = useState<boolean>(false);

  // Derived fun facts & benchmarks
  const zodiac = getZodiacInfo(result.month, result.day);
  const season = getSeasonInfo(result.month);
  const paradox = getBirthdayParadoxInfo(result.dailyProbability, result.isLeapDay);
  const crowdStats = calculateCrowdProbabilities(crowdSlider, result.dailyProbability, result.isLeapDay);
  const benchmarks = getBenchmarkComparisons(result.averageAnnualBirths, result.formattedDate);

  // Secret birth rate stats
  const birthsPerHour = Math.round(result.averageAnnualBirths / 24);
  const birthsPerMinute = (result.averageAnnualBirths / (24 * 60)).toFixed(1);

  // Initial count-up animation
  useEffect(() => {
    // Fire celebratory confetti cannons on mount
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      const colors = ['#E63946', '#FFB703', '#48CAE4', '#9D4EDD', '#F4A261', '#FFF'];
      confetti({
        particleCount: 65,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.7 },
        colors,
        ticks: 260,
        scalar: 1.15,
        startVelocity: 50,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 65,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.7 },
        colors,
        ticks: 260,
        scalar: 1.15,
        startVelocity: 50,
        disableForReducedMotion: true,
      });
    }

    const target = result.rarerThanPercent;
    if (prefersReducedMotion || target === 0) {
      setAnimatedPercent(target);
      return;
    }

    const duration = 900;
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPercent(Math.round(eased * target));

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    const animFrame = requestAnimationFrame(updateCounter);
    trackEvent('result_viewed', { date: result.birthday_mm_dd, rarity: target });

    return () => cancelAnimationFrame(animFrame);
  }, [result]);

  const shareUrl = `${window.location.origin}${window.location.pathname}?date=${result.birthday_mm_dd}`;
  const shareCopy = `My birthday (${result.formattedDate}) is rarer than ${result.rarerThanPercent}% of birthdays in India! Check your birthday rarity here: ${shareUrl}`;

  // Captures the EXACT card currently displayed on screen (Classic or Stats)
  const getCapturedCardDataUrl = async (): Promise<string> => {
    if (cardRef.current) {
      try {
        const dataUrl = await toPng(cardRef.current, {
          pixelRatio: 2.5,
          cacheBust: true,
          style: {
            transform: 'none',
          },
          filter: (node: HTMLElement) => {
            // Exclude interactive hover/click hints from card export
            if (node.classList && node.classList.contains('cake-hover-hint')) {
              return false;
            }
            return true;
          },
        });
        return dataUrl;
      } catch (err) {
        console.warn('DOM card capture fallback:', err);
      }
    }
    return generateShareCard(result);
  };

  const handleNativeShare = async () => {
    trackEvent('result_shared', { method: 'native', date: result.birthday_mm_dd, mode: cardMode });
    setIsDownloading(true);
    
    try {
      // Capture the exact card shown on screen
      const dataUrl = await getCapturedCardDataUrl();
      const imageFile = dataURLtoFile(dataUrl, `howrareisyourbirthday-${cardMode}-${result.birthday_mm_dd}.png`);

      // If Web Share API with files is supported (mobile Safari iOS, Chrome Android)
      if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        await navigator.share({
          files: [imageFile],
          title: 'How Rare Is Your Birthday? — India',
          text: `My birthday (${result.formattedDate}) is rarer than ${result.rarerThanPercent}% of birthdays in India! Check yours: ${shareUrl}`,
        });
        onShowToast('Card ready! Tap Instagram Story, WhatsApp or Save.');
        setIsDownloading(false);
        return;
      }

      // Fallback: Web Share without files
      if (navigator.share) {
        await navigator.share({
          title: 'How Rare Is Your Birthday? — India',
          text: shareCopy,
          url: shareUrl,
        });
        onShowToast('Link shared successfully!');
        setIsDownloading(false);
        return;
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share error:', err);
        await handleDownloadCard();
        onShowToast('Card saved! You can now post it to your Instagram Story 📸');
      }
      setIsDownloading(false);
      return;
    }

    // Fallback for desktop browsers without navigator.share
    setIsDownloading(false);
    await handleDownloadCard();
    onShowToast('Card saved! Open Instagram on your phone to add it to your story 📸');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    onShowToast('Result link copied to clipboard!');
    trackEvent('result_shared', { method: 'copy_link', date: result.birthday_mm_dd });
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleDownloadCard = async () => {
    setIsDownloading(true);
    try {
      const dataUrl = await getCapturedCardDataUrl();
      const link = document.createElement('a');
      link.download = `howrareisyourbirthday-${cardMode}-${result.birthday_mm_dd}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      trackEvent('share_card_downloaded', { date: result.birthday_mm_dd, mode: cardMode });
      onShowToast(`${cardMode === 'classic' ? 'Classic' : 'Stats'} Card downloaded!`);
    } catch (err) {
      console.error(err);
      onShowToast('Failed to generate image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Determine BirthdayTraffic-inspired rank category badge
  let rankCategory = 'BALANCED BIRTHDAY';
  if (result.isLeapDay) {
    rankCategory = 'CALENDAR ANOMALY (1 IN 4 YEARS)';
  } else if (result.rarityRank <= 25) {
    rankCategory = 'TOP 25 RAREST DATES';
  } else if (result.rarerThanPercent >= 65) {
    rankCategory = 'ON THE RARER SIDE';
  } else if (result.rarerThanPercent >= 35) {
    rankCategory = 'COMMON & POPULAR DATE';
  } else {
    rankCategory = 'PEAK BIRTHDAY SEASON';
  }

  return (
    <div className="bt-results-wrapper">
      {/* ============================================================
          CARD 1: THE COOL SOCIAL SHARE CARD (Classic & Stats Modes)
          ============================================================ */}
      {cardMode === 'classic' ? (
        /* CLASSIC MODE: Consistent Horizontal Split Banner on ALL devices */
        <section ref={cardRef} className="bt-card bt-classic-horizontal-card">
          <div className="bt-classic-content">
            <div className="bt-classic-date-label">{result.formattedDate}</div>
            
            <div className="bt-classic-stat-wrap">
              <div className="bt-classic-percent">
                {result.rarerThanPercent < 50
                  ? `TOP ${Math.max(1, 100 - result.rarerThanPercent)}%`
                  : `TOP ${result.rarerThanPercent}%`}
              </div>
              <div className="bt-classic-headline">
                {result.rarerThanPercent < 50 ? 'MOST COMMON BIRTHDAYS' : 'RAREST BIRTHDAYS'}
              </div>
            </div>
          </div>

          {/* 3D Birthday Cake on Right Side */}
          <div className="bt-classic-cake-aside">
            <BirthdayCake
              size="md"
              onBlow={() => onShowToast('Wish made. May all your dreams take flight.')}
            />
          </div>

          {/* Card Footer spanning full width across bottom */}
          <div className="bt-classic-footer">
            <span>how rare is yours?</span>
            <span className="bt-classic-brand">howrareisyourbirthday.fun</span>
          </div>
        </section>
      ) : (
        /* STATS MODE: Modern Portrait Collectible Card */
        <section ref={cardRef} className="bt-card bt-stats-portrait-card">
          <div className="bt-stats-header">
            <div className="bt-stats-date">{result.formattedDate}</div>
            <div className="bt-stats-tag">{rankCategory}</div>
            <div className="bt-stats-verdict">
              {result.rarerThanPercent >= 75
                ? 'Very rare'
                : result.rarerThanPercent >= 50
                ? 'On the rarer side'
                : result.rarerThanPercent >= 25
                ? 'Common date'
                : 'Very common'}
            </div>
          </div>

          {/* 3D Birthday Cake Centerpiece */}
          <div className="bt-cake-mount-area">
            <BirthdayCake
              size="md"
              onBlow={() => onShowToast('Wish made. May all your dreams take flight.')}
            />
          </div>

          <div className="bt-stats-body">
            <div className="bt-stats-subline">
              {result.rarerThanPercent < 50 ? 'More common than' : 'Rarer than'}
            </div>
            <div className="bt-stats-big-number">
              {result.rarerThanPercent < 50 ? `${100 - animatedPercent}%` : `${animatedPercent}%`}
            </div>
            <div className="bt-stats-subcaption">of other birthday dates.</div>

            <div className="bt-stats-ratio-box">
              <div className="bt-stats-ratio-val">
                1 in {Math.round(25000000 / result.averageAnnualBirths)}
              </div>
              <div className="bt-stats-ratio-desc">
                births in this sample share your birthday (Rank #{result.rarityRank}).
              </div>
            </div>
          </div>

          <div className="bt-stats-card-footer">
            <span>how rare is yours?</span>
            <span>howrareisyourbirthday.fun</span>
          </div>
        </section>
      )}

      {/* ============================================================
          CHOOSE YOUR BIRTHDAY CARD (Segmented Switcher & Actions)
          ============================================================ */}
      <div className="bt-card-picker-section">
        <div className="bt-picker-heading">Choose your birthday card</div>
        
        {/* Segmented Switcher: Classic vs Stats */}
        <div className="bt-card-segmented-control">
          <button
            type="button"
            className={`bt-segment-btn ${cardMode === 'classic' ? 'is-active' : ''}`}
            onClick={() => setCardMode('classic')}
          >
            Classic
          </button>
          <button
            type="button"
            className={`bt-segment-btn ${cardMode === 'stats' ? 'is-active' : ''}`}
            onClick={() => setCardMode('stats')}
          >
            Stats
          </button>
        </div>

        {/* Action Buttons: Send Card / Save Image / Share Link / Post to X */}
        <div className="bt-share-actions-suite">
          <button
            type="button"
            className="bt-send-card-btn"
            onClick={handleNativeShare}
          >
            <span>Send card</span>
          </button>

          <div className="bt-dual-sub-actions">
            <button
              type="button"
              className="bt-sub-action-btn"
              onClick={handleDownloadCard}
              disabled={isDownloading}
            >
              <span>{isDownloading ? 'Saving...' : 'Save image'}</span>
            </button>

            <button
              type="button"
              className="bt-sub-action-btn"
              onClick={handleCopyLink}
            >
              <span>{isCopied ? 'Link Copied!' : 'Send birthday link'}</span>
            </button>
          </div>

          <button
            type="button"
            className="bt-sub-action-btn bt-full-sub-btn"
            onClick={() => {
              const tweetText = encodeURIComponent(
                `My birthday (${result.formattedDate}) is rarer than ${result.rarerThanPercent}% of birthdays! Check yours:`
              );
              window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(shareUrl)}`, '_blank');
            }}
          >
            <span>Post to X</span>
          </button>

          <div className="bt-share-hint">
            <span>✨ Tap <strong>Send card</strong> on phone to share directly to your Instagram Story</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          CARD 2: THE 50–50 CROWD (Birthday Paradox)
          ============================================================ */}
      <section className="bt-card bt-twin-crowd-card">
        <div className="bt-card-label-row">
          <span>The 50–50 Crowd</span>
        </div>

        <h3 className="bt-section-heading">Your birthday twin is out there.</h3>

        {/* Big Display Figure */}
        <div className="bt-big-stat-highlight">
          <span className="bt-huge-number">~{paradox.roomSizeForMatch}</span>
          <span className="bt-huge-unit">people for a 50% chance of a twin</span>
        </div>

        <p className="bt-section-desc">
          {result.isLeapDay
            ? `Because 29 February occurs only once every 4 years, you'd need a gathering of ~${paradox.roomSizeForMatch} people to have a 50–50 chance of meeting a fellow leapling!`
            : result.rawRank <= 30
            ? `Because ${result.formattedDate} is one of India's most common birthdays, you need only ~${paradox.roomSizeForMatch} people (fewer than the calendar average of 253) for a 50% chance of a twin.`
            : result.rawRank >= 335
            ? `Because ${result.formattedDate} is a rarer birthdate in India, you need a larger crowd (~${paradox.roomSizeForMatch} people vs the average 253) to find someone sharing your day.`
            : `In a gathering of ~${paradox.roomSizeForMatch} people, there is a 50–50 chance at least one person shares your exact birthday (${result.formattedDate}).`}
        </p>

        <div className="bt-divider-line" />

        {/* Interactive Crowd Slider */}
        <div className="bt-slider-section">
          <div className="bt-slider-header">
            <span className="bt-slider-label">
              Try a crowd: <strong>{crowdSlider} people</strong>
            </span>
          </div>

          {/* Quick preset jump pills */}
          <div className="bt-crowd-preset-chips" role="group" aria-label="Crowd size quick presets">
            {[
              { label: '23 (Classic)', value: 23 },
              { label: '100 (Party)', value: 100 },
              { label: `~${paradox.roomSizeForMatch} (50% Twin)`, value: paradox.roomSizeForMatch },
              { label: result.isLeapDay ? '1,000 (Hall)' : '500 (Hall)', value: result.isLeapDay ? 1000 : 500 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`bt-preset-chip ${crowdSlider === preset.value ? 'is-active' : ''}`}
                onClick={() => setCrowdSlider(preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <input
            id="crowd-range"
            type="range"
            min="10"
            max={result.isLeapDay ? 1200 : 500}
            step="1"
            value={crowdSlider}
            onChange={(e) => setCrowdSlider(parseInt(e.target.value, 10))}
            className="bt-crowd-slider"
            aria-label="Crowd size slider"
          />

          {/* Clean Probability Rows */}
          <div className="bt-prob-clean-list">
            <div className="bt-prob-clean-row">
              <div className="bt-prob-meta">
                <span className="bt-prob-name">Someone matches your birthday ({result.formattedDate})</span>
                <span className="bt-prob-val">{crowdStats.userMatchPercent}%</span>
              </div>
              <div className="bt-progress-track">
                <div
                  className="bt-progress-fill bt-fill-user"
                  style={{ width: `${crowdStats.userMatchPercent}%` }}
                />
              </div>
            </div>

            <div className="bt-prob-clean-row">
              <div className="bt-prob-meta">
                <span className="bt-prob-name">Any two people match each other</span>
                <span className="bt-prob-val">{crowdStats.anyMatchPercent}%</span>
              </div>
              <div className="bt-progress-track">
                <div
                  className="bt-progress-fill bt-fill-any"
                  style={{ width: `${crowdStats.anyMatchPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          CARD 3: BENCHMARKS (Your Birthday, in Perspective)
          ============================================================ */}
      <section className="bt-card bt-perspective-card">
        <div className="bt-card-label-row">
          <span>Calendar Benchmarks</span>
        </div>

        <h3 className="bt-section-heading">Your birthday, in perspective.</h3>

        {/* Stacked Benchmark Comparison Bars */}
        <div className="bt-benchmark-bars-list">
          {benchmarks.map((item) => {
            const isUser = item.dateName === result.formattedDate;
            return (
              <div key={item.dateName} className={`bt-benchmark-row ${isUser ? 'is-user-row' : ''}`}>
                <div className="bt-benchmark-labels">
                  <span className="bt-benchmark-name">
                    {item.dateName} {isUser && <span className="bt-user-badge">YOU</span>}
                  </span>
                  <span className="bt-benchmark-births">
                    ~{item.annualBirths.toLocaleString('en-IN')} / yr
                  </span>
                </div>

                <div className="bt-benchmark-track">
                  <div
                    className={`bt-benchmark-fill ${isUser ? 'fill-user' : 'fill-milestone'}`}
                    style={{ width: `${item.barPercent}%` }}
                  />
                </div>

                <div className="bt-benchmark-sub-meta">
                  <span>{item.subtitle}</span>
                  <span className="bt-benchmark-ratio">{item.ratioToUser}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          CARD 4: 2-COLUMN GRID (Season & Daily Birth Rate)
          ============================================================ */}
      <div className="bt-cards-two-col">
        {/* Season & Astrological Sign */}
        <section className="bt-card bt-season-card">
          <div className="bt-card-label-row">
            <span>Season & Astrology</span>
          </div>

          <h3 className="bt-section-heading">Born in {season.name}</h3>

          <div className="bt-season-feature-grid">
            <div className="bt-feature-box">
              <div className="bt-feature-title">{season.name}</div>
              <div className="bt-feature-desc">{season.ritu}</div>
            </div>

            <div className="bt-feature-box">
              <div className="bt-feature-title">{zodiac.sign}</div>
              <div className="bt-feature-desc">{zodiac.element} Sign</div>
            </div>
          </div>
        </section>

        {/* Daily Birth Rate Foil */}
        <section className="bt-card bt-foil-card">
          <div className="bt-card-label-row">
            <span>Daily Birth Rate</span>
          </div>

          <h3 className="bt-section-heading">Births on this day</h3>

          {!isFoilRevealed ? (
            <div
              className="bt-holographic-foil"
              onClick={() => setIsFoilRevealed(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsFoilRevealed(true)}
              aria-label="Click to reveal statistic"
            >
              <div className="bt-foil-shimmer" />
              <div className="bt-foil-content">
                <span className="bt-foil-text">Scratch to reveal</span>
                <span className="bt-foil-subtext">India daily birth rate</span>
              </div>
            </div>
          ) : (
            <div className="bt-revealed-stat-box">
              <div className="bt-revealed-number">~{birthsPerMinute}</div>
              <div className="bt-revealed-label">births per minute in India</div>
              <div className="bt-revealed-sub">
                (~{birthsPerHour.toLocaleString('en-IN')} per hour)
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ============================================================
          CARD 5: CALENDAR EXTREMES
          ============================================================ */}
      <section className="bt-card bt-extremes-card">
        <div className="bt-card-label-row">
          <span>Calendar Extremes</span>
        </div>

        <h3 className="bt-section-heading">Least & Most Common Dates</h3>

        <div className="bt-extremes-grid">
          {/* Top 5 Rarest */}
          <div className="bt-extreme-column">
            <h4 className="bt-col-title">5 Least Common</h4>
            <div className="bt-extreme-list">
              {TOP_RAREST_DATES.map((item) => {
                const isUser = item.mmdd === result.birthday_mm_dd;
                return (
                  <div key={item.mmdd} className={`bt-extreme-row ${isUser ? 'is-highlighted' : ''}`}>
                    <span className="bt-rank-tag">#{item.rank}</span>
                    <span className="bt-extreme-date">{item.date}</span>
                    <span className="bt-extreme-births">{item.approxBirths}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top 5 Most Common */}
          <div className="bt-extreme-column">
            <h4 className="bt-col-title">5 Most Common</h4>
            <div className="bt-extreme-list">
              {TOP_COMMON_DATES.map((item) => {
                const isUser = item.mmdd === result.birthday_mm_dd;
                return (
                  <div key={item.mmdd} className={`bt-extreme-row ${isUser ? 'is-highlighted' : ''}`}>
                    <span className="bt-rank-tag">#{item.rank}</span>
                    <span className="bt-extreme-date">{item.date}</span>
                    <span className="bt-extreme-births">{item.approxBirths}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Reset Action */}
      <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '8px' }}>
        <button type="button" className="bt-btn-reset" onClick={onReset}>
          <RotateCcw size={14} />
          <span>Check another birthday</span>
        </button>
      </div>
    </div>
  );
};
