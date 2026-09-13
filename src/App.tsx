import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { DateSelector } from './components/DateSelector';
import { ResultCard } from './components/ResultCard';
import { MethodologyModal } from './components/MethodologyModal';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { getBirthdayResult, parseMMDD, isValidDate } from './utils/calculator';
import { trackEvent } from './utils/analytics';
import type { BirthdayResult } from './types/birthday';

export function App() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());
  const [result, setResult] = useState<BirthdayResult | null>(null);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // 1. Initial deep-link check & page_view tracking
  useEffect(() => {
    trackEvent('page_view');

    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    const mParam = params.get('m');
    const dParam = params.get('d');

    let targetMonth: number | null = null;
    let targetDay: number | null = null;

    if (dateParam) {
      const parsed = parseMMDD(dateParam);
      if (parsed) {
        targetMonth = parsed.month;
        targetDay = parsed.day;
      }
    } else if (mParam && dParam) {
      const m = parseInt(mParam, 10);
      const d = parseInt(dParam, 10);
      if (isValidDate(m, d)) {
        targetMonth = m;
        targetDay = d;
      }
    }

    if (targetMonth && targetDay) {
      setSelectedMonth(targetMonth);
      setSelectedDay(targetDay);
      const res = getBirthdayResult(targetMonth, targetDay);
      if (res) {
        setResult(res);
        setIsRevealed(true);
      }
    }
  }, []);

  // Handle date change from picker
  const handleDateChange = (month: number, day: number) => {
    setSelectedMonth(month);
    setSelectedDay(day);
  };

  // Handle Preset Click
  const handleSelectPreset = (month: number, day: number) => {
    setSelectedMonth(month);
    setSelectedDay(day);
    const res = getBirthdayResult(month, day);
    if (res) {
      setResult(res);
      setIsRevealed(true);
      updateUrl(res.birthday_mm_dd);
    }
  };

  // Handle Reveal
  const handleReveal = () => {
    const res = getBirthdayResult(selectedMonth, selectedDay);
    if (res) {
      setResult(res);
      setIsRevealed(true);
      updateUrl(res.birthday_mm_dd);
      // Scroll to top of card smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle Reset to pick another date
  const handleReset = () => {
    setIsRevealed(false);
    // Clear url date query without reloading
    const url = new URL(window.location.href);
    url.searchParams.delete('date');
    url.searchParams.delete('m');
    url.searchParams.delete('d');
    window.history.pushState({}, '', url.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync URL query string
  const updateUrl = (mmdd: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('date', mmdd);
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="app-container">
      <Header onHome={handleReset} />

      <div className="max-w-content">
        <main style={{ paddingBottom: '32px' }}>
          {!isRevealed ? (
            <>
              <Hero onSelectPreset={handleSelectPreset} />
              <DateSelector
                selectedMonth={selectedMonth}
                selectedDay={selectedDay}
                onDateChange={handleDateChange}
                onReveal={handleReveal}
              />
            </>
          ) : (
            result && (
              <ResultCard
                key={result.birthday_mm_dd}
                result={result}
                onReset={handleReset}
                onShowToast={showToast}
              />
            )
          )}
        </main>
      </div>

      <Footer onOpenMethodology={() => setIsMethodologyOpen(true)} />

      {/* Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

      {/* Floating Toast Notification */}
      <Toast message={toastMessage} />
    </div>
  );
}

export default App;
