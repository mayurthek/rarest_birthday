import React from 'react';
import { BirthdayCake } from './BirthdayCake';

interface HeroProps {
  onSelectPreset?: (month: number, day: number) => void;
}

export const Hero: React.FC<HeroProps> = () => {
  return (
    <section className="hero-section">
      {/* Interactive Birthday Cake on Landing */}
      <div className="hero-cake-wrapper">
        <BirthdayCake size="lg" />
      </div>

      <h1 className="hero-title">
        How rare is<br />your birthday?
      </h1>
    </section>
  );
};
