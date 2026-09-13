import React, { useEffect, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { MONTH_NAMES, DAYS_IN_MONTH, isValidDate } from '../utils/calculator';
import { trackEvent } from '../utils/analytics';

const ITEM_HEIGHT = 48; // px per reel item

interface ScrollWheelProps<T> {
  items: T[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  themeClass: string;
  ariaLabel: string;
  labelTitle: string;
}

function ScrollWheel<T>({
  items,
  selectedIndex,
  onSelect,
  renderItem,
  themeClass,
  ariaLabel,
  labelTitle,
}: ScrollWheelProps<T>) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const scrollTimeout = useRef<number | null>(null);

  const isInitialMount = useRef(true);

  // Sync scroll position with selectedIndex
  const scrollTo = useCallback((index: number, smooth = true) => {
    if (!viewportRef.current) return;
    const targetTop = index * ITEM_HEIGHT;
    if (Math.abs(viewportRef.current.scrollTop - targetTop) > 1) {
      isProgrammaticScroll.current = true;
      viewportRef.current.scrollTo({
        top: targetTop,
        behavior: smooth ? 'smooth' : 'auto',
      });
      // Clear flag after animation settles
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, smooth ? 280 : 50);
    }
  }, []);

  // Update position on mount and whenever selectedIndex changes externally
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      scrollTo(selectedIndex, false);
    } else {
      scrollTo(selectedIndex, true);
    }
  }, [selectedIndex, scrollTo]);

  // Handle scroll events with snapping detection
  const handleScroll = () => {
    if (!viewportRef.current || isProgrammaticScroll.current) return;

    if (scrollTimeout.current) {
      window.clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = window.setTimeout(() => {
      if (!viewportRef.current) return;
      const scrollTop = viewportRef.current.scrollTop;
      const rawIndex = Math.round(scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, rawIndex));
      if (clampedIndex !== selectedIndex) {
        onSelect(clampedIndex);
      }
    }, 60);
  };

  const handleStep = (delta: number) => {
    const newIndex = Math.max(0, Math.min(items.length - 1, selectedIndex + delta));
    if (newIndex !== selectedIndex) {
      onSelect(newIndex);
      scrollTo(newIndex, true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleStep(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleStep(1);
    }
  };

  return (
    <div className="wheel-reel-column">
      <span className="wheel-label-badge">{labelTitle}</span>

      <div className={`wheel-reel-wrapper ${themeClass}`}>
        {/* Step Up Button */}
        <button
          type="button"
          className="wheel-stepper-btn wheel-stepper-up"
          onClick={() => handleStep(-1)}
          aria-label={`Previous ${labelTitle}`}
          tabIndex={-1}
        >
          <ChevronUp size={16} strokeWidth={2.4} />
        </button>

        {/* Dedicated Viewport Box for pixel-perfect lens alignment */}
        <div className="wheel-viewport-box">
          {/* Optical Glass Center Selection Lens */}
          <div className="wheel-selection-lens" aria-hidden="true" />

          {/* Scrollable Viewport */}
          <div
            ref={viewportRef}
            className="wheel-scroll-viewport"
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="listbox"
            aria-label={ariaLabel}
          >
            {/* Top Padding Spacer */}
            <div style={{ height: ITEM_HEIGHT, minHeight: ITEM_HEIGHT, flexShrink: 0 }} aria-hidden="true" />

            {/* Reel Items */}
            {items.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={idx}
                  className={`wheel-item-row ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => {
                    onSelect(idx);
                    scrollTo(idx, true);
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  {renderItem(item, isSelected)}
                </div>
              );
            })}

            {/* Bottom Padding Spacer */}
            <div style={{ height: ITEM_HEIGHT, minHeight: ITEM_HEIGHT, flexShrink: 0 }} aria-hidden="true" />
          </div>
        </div>

        {/* Step Down Button */}
        <button
          type="button"
          className="wheel-stepper-btn wheel-stepper-down"
          onClick={() => handleStep(1)}
          aria-label={`Next ${labelTitle}`}
          tabIndex={-1}
        >
          <ChevronDown size={16} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

interface DateSelectorProps {
  selectedMonth: number;
  selectedDay: number;
  onDateChange: (month: number, day: number) => void;
  onReveal: () => void;
  isLoading?: boolean;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedMonth,
  selectedDay,
  onDateChange,
  onReveal,
  isLoading = false,
}) => {
  const maxDays = DAYS_IN_MONTH[selectedMonth - 1];

  // Month change
  const handleSelectMonth = (monthIndex: number) => {
    const newMonth = monthIndex + 1;
    const newMaxDays = DAYS_IN_MONTH[newMonth - 1];
    const newDay = selectedDay > newMaxDays ? newMaxDays : selectedDay;
    onDateChange(newMonth, newDay);
    trackEvent('birthday_selected', { month: newMonth, day: newDay });
  };

  // Day change
  const handleSelectDay = (dayIndex: number) => {
    const newDay = dayIndex + 1;
    onDateChange(selectedMonth, newDay);
    trackEvent('birthday_selected', { month: selectedMonth, day: newDay });
  };

  const isLeapDay = selectedMonth === 2 && selectedDay === 29;
  const isDateValid = isValidDate(selectedMonth, selectedDay);

  // Generate day items array for currently active month
  const dayItems = Array.from({ length: maxDays }, (_, i) => i + 1);

  return (
    <div className="picker-card">
      {/* Interactive Scrollable Dual-Wheel Reels */}
      <div className="wheels-container">
        {/* Month Scroll Reel (Buttercup Yellow) */}
        <ScrollWheel
          items={MONTH_NAMES}
          selectedIndex={selectedMonth - 1}
          onSelect={handleSelectMonth}
          themeClass="reel-month"
          labelTitle="Month"
          ariaLabel="Scroll or use arrow keys to select birth month"
          renderItem={(monthName) => (
            <span className="wheel-item-text">{monthName}</span>
          )}
        />

        {/* Day Scroll Reel (Dusty Pink) */}
        <ScrollWheel
          items={dayItems}
          selectedIndex={Math.min(selectedDay - 1, maxDays - 1)}
          onSelect={handleSelectDay}
          themeClass="reel-day"
          labelTitle="Day"
          ariaLabel="Scroll or use arrow keys to select birth day"
          renderItem={(dayNum) => (
            <span className="wheel-item-text">{dayNum}</span>
          )}
        />
      </div>

      {/* Leap Day Indicator Banner */}
      {isLeapDay && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            padding: '11px 16px',
            borderRadius: '14px',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '18px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--bt-charcoal)',
            }}
          />
          <span>Leap Day: 29 February occurs once every four years.</span>
        </div>
      )}

      {/* Primary Reveal CTA */}
      <button
        type="button"
        className="btn-cta"
        onClick={onReveal}
        disabled={!isDateValid || isLoading}
      >
        <span>{isLoading ? 'Calculating...' : 'Reveal Birthday'}</span>
      </button>
    </div>
  );
};
