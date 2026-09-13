import React from 'react';
import { Sparkles, Users } from 'lucide-react';
import type { BirthdayResult } from '../types/birthday';

interface RaritySpectrumProps {
  result: BirthdayResult;
}

export const RaritySpectrum: React.FC<RaritySpectrumProps> = ({ result }) => {
  return (
    <div className="spectrum-card">
      <div className="spectrum-labels">
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EA580C' }}>
          <Sparkles size={14} />
          Less Common (Rarest)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0284C7' }}>
          More Common (Peak)
          <Users size={14} />
        </span>
      </div>

      <div className="spectrum-track" role="progressbar" aria-valuenow={result.spectrumPosition} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="spectrum-pin pin-pulse"
          style={{ left: `${result.spectrumPosition}%` }}
          title={`${result.formattedDate}: ${result.relativeFrequency.toFixed(3)}x relative frequency`}
        />
      </div>

      <div className="spectrum-details">
        <span>
          <strong>{result.relativeFrequency.toFixed(3)}×</strong> modeled average
        </span>
        <span>
          ~{result.averageAnnualBirths.toLocaleString('en-IN')} births / year
        </span>
      </div>
    </div>
  );
};
