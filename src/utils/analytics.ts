// Lightweight, privacy-first analytics event tracker for V1

export type AnalyticsEvent =
  | 'page_view'
  | 'birthday_selected'
  | 'result_viewed'
  | 'result_shared'
  | 'share_card_downloaded';

export function trackEvent(event: AnalyticsEvent, payload?: Record<string, string | number | boolean>): void {
  try {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[Analytics: ${event}]`, payload || {});
    }

    // Increment local session counters for auditability
    const sessionKey = `rb_event_${event}`;
    const prevCount = parseInt(sessionStorage.getItem(sessionKey) || '0', 10);
    sessionStorage.setItem(sessionKey, String(prevCount + 1));

    // Dispatch custom DOM event for external listening (e.g., GA, Plausible, Tag Manager)
    window.dispatchEvent(
      new CustomEvent('rarest_birthday_event', {
        detail: { event, payload, timestamp: Date.now() },
      })
    );
  } catch {
    // Graceful fallback
  }
}
