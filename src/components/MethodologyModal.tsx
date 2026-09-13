import React from 'react';
import { X, ShieldCheck, Database } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} color="var(--bt-charcoal)" />
            <h3 className="modal-title">How It Works</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '16px' }}>
            <strong>How Rare Is Your Birthday? — India</strong> estimates the relative rarity of calendar birth dates across India based on a comprehensive 2010–2024 national birth distribution model.
          </p>

          <div style={{ background: 'var(--bg-cream-soft)', padding: '14px 16px', borderRadius: '14px', border: '1px solid var(--border-light)', marginBottom: '18px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--indigo-deep)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="#EA580C" /> Key Sources
            </h4>
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px', fontSize: '13.5px' }}>
              <li style={{ marginBottom: '6px' }}>
                <strong>Annual National Births:</strong> UN World Population Prospects (WPP 2024 Revision) annual birth totals for India (2010–2024).
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Seasonality Pattern:</strong> Average monthly birth shares derived from official Indian state vital statistics registration reports (Kerala 2023 & Chhattisgarh 2022).
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Leap Day Coverage:</strong> 29 February has 4 eligible years (2012, 2016, 2020, 2024) compared to 15 eligible years for all other calendar dates.
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--indigo-deep)', marginBottom: '6px' }}>
              Percentile vs. Frequency Ratio
            </h4>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              The user-facing rarity percentile indicates the percentage of Indian calendar dates that are <em>more common</em> than your birthday. A score of 72% means your birthday is rarer than 72% of other days in the year.
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--indigo-deep)', marginBottom: '6px' }}>
              Important Disclaimer
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              This product provides a demographic model estimate, not an exhaustive count of every individual born in India. Day-level official registry publications are not publicly centralized in India; results may change as higher-resolution empirical birth records (e.g. weighted NFHS survey microdata and CRS registers) are incorporated.
            </p>
          </div>

          <button
            type="button"
            className="btn-action-primary"
            style={{ width: '100%' }}
            onClick={onClose}
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
