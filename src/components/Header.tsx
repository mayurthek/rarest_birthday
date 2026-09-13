import React from 'react';

interface HeaderProps {
  onHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onHome }) => {
  return (
    <header className="site-header">
      <button
        type="button"
        className="brand-badge"
        onClick={onHome}
        aria-label="Return to main page"
      >
        <span className="brand-name">birthday traffic</span>
      </button>
    </header>
  );
};
