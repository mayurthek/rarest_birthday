import React from 'react';
import { Info } from 'lucide-react';

interface FooterProps {
  onOpenMethodology: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenMethodology }) => {
  return (
    <footer className="site-footer">
      <div className="max-w-content">
        <div style={{ marginBottom: '14px' }}>
          <button 
            type="button" 
            className="footer-how-it-works-btn" 
            onClick={onOpenMethodology}
            title="Learn how birthday rarity is calculated"
          >
            <Info size={14} strokeWidth={2.2} />
            <span>How it works</span>
          </button>
        </div>
        <p style={{ maxWidth: '520px', margin: '0 auto', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Modeled estimate based on India 2010–2024 birth distribution data (UN WPP 2024 and state CRS seasonality reports).
        </p>
      </div>
    </footer>
  );
};
