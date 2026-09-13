import React, { useRef, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, RotateCcw } from 'lucide-react';

interface ScratchCardProps {
  birthsPerMinute: string;
  birthsPerHour: number;
  averageAnnualBirths: number;
}

export const ScratchCard: React.FC<ScratchCardProps> = ({
  birthsPerMinute,
  birthsPerHour,
  averageAnnualBirths,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState<boolean>(false);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [scratchPercent, setScratchPercent] = useState<number>(0);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize Canvas Foil
  const initFoil = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = Math.floor(rect.width) || 280;
    const height = Math.floor(rect.height) || 120;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Reset composite mode
    ctx.globalCompositeOperation = 'source-over';

    // Premium Holographic Foil Gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#CBD8E6');
    grad.addColorStop(0.25, '#E5D6E4');
    grad.addColorStop(0.5, '#F5EBDD');
    grad.addColorStop(0.75, '#DCE3EC');
    grad.addColorStop(1, '#EBD7DE');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Metallic shimmer stripes
    ctx.save();
    ctx.rotate(-Math.PI / 8);
    for (let x = -width; x < width * 2; x += 36) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(x, -height * 2, 14, height * 4);
    }
    ctx.restore();

    // Subtle Sparkle dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let i = 0; i < 20; i++) {
      const sx = (i * 47) % width;
      const sy = (i * 31) % height;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Centered Scratch Badge
    const badgeW = Math.min(width - 24, 210);
    const badgeH = 50;
    const bx = (width - badgeW) / 2;
    const by = (height - badgeH) / 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.beginPath();
    ctx.roundRect(bx, by, badgeW, badgeH, 14);
    ctx.fill();

    ctx.strokeStyle = 'rgba(125, 76, 93, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text instructions
    ctx.fillStyle = '#242728';
    ctx.font = '800 13.5px "Inter UI", "Inter", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ Scratch to reveal', width / 2, by + 18);

    ctx.fillStyle = '#6E5C68';
    ctx.font = '600 11px "Inter UI", "Inter", -apple-system, sans-serif';
    ctx.fillText('Rub with finger or mouse', width / 2, by + 34);

    ctx.restore();
    setIsRevealed(false);
    setScratchPercent(0);
  }, []);

  // Set up foil on mount and resize
  useEffect(() => {
    initFoil();

    const handleResize = () => {
      if (!isRevealed) {
        initFoil();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initFoil, isRevealed]);

  // Calculate percentage of transparent pixels
  const checkScratchPercentage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const sampleStep = 20; // High performance sampling
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let transparent = 0;
    let total = 0;

    for (let y = 0; y < height; y += sampleStep) {
      for (let x = 0; x < width; x += sampleStep) {
        const idx = (y * width + x) * 4;
        if (data[idx + 3] < 64) {
          transparent++;
        }
        total++;
      }
    }

    const pct = total > 0 ? Math.round((transparent / total) * 100) : 0;
    setScratchPercent(pct);

    // If 40% or more has been scratched, automatically reveal the rest with celebration!
    if (pct >= 40) {
      revealEntirely();
    }
  }, [isRevealed]);

  // Full reveal handler
  const revealEntirely = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.transition = 'opacity 0.35s ease-out';
      canvas.style.opacity = '0';
      setTimeout(() => {
        setIsRevealed(true);
      }, 350);
    } else {
      setIsRevealed(true);
    }

    // Celebrate with mini confetti
    confetti({
      particleCount: 28,
      spread: 55,
      origin: { y: 0.75 },
      colors: ['#FFB703', '#E63946', '#48CAE4', '#9D4EDD'],
    });
  }, []);

  // Scratch Drawing
  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (clientX - rect.left) * dpr;
    const y = (clientY - rect.top) * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 42 * dpr;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (lastPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 21 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    lastPointRef.current = { x, y };
  };

  // Pointer event listeners
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isRevealed) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsScratching(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      lastPointRef.current = {
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr,
      };
      scratch(e.clientX, e.clientY);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isScratching || isRevealed) return;
    scratch(e.clientX, e.clientY);
    checkScratchPercentage();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsScratching(false);
    lastPointRef.current = null;
    checkScratchPercentage();
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore if pointer capture release fails
    }
  };

  return (
    <div className="bt-scratch-wrapper">
      <div ref={containerRef} className="bt-scratch-box">
        {/* Underlying revealed content */}
        <div className="bt-revealed-stat-box">
          <div className="bt-revealed-number">~{birthsPerMinute}</div>
          <div className="bt-revealed-label">births per minute in India</div>
          <div className="bt-revealed-sub">
            (~{birthsPerHour.toLocaleString('en-IN')} / hour · ~{averageAnnualBirths.toLocaleString('en-IN')} / year)
          </div>
        </div>

        {/* Canvas Foil Overlay */}
        {!isRevealed && (
          <canvas
            ref={canvasRef}
            className="bt-scratch-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            aria-label="Interactive scratch foil. Scratch with mouse or finger to reveal birth rate."
          />
        )}
      </div>

      {/* Helper / Action Row */}
      <div className="bt-scratch-actions">
        {!isRevealed ? (
          <div className="bt-scratch-hint-row">
            <span className="bt-scratch-progress-tag">
              {scratchPercent > 0 ? `${scratchPercent}% scratched` : '🪙 Ready to scratch'}
            </span>
            <button
              type="button"
              className="bt-quick-reveal-btn"
              onClick={revealEntirely}
            >
              <Sparkles size={12} />
              <span>Reveal all</span>
            </button>
          </div>
        ) : (
          <div className="bt-scratch-hint-row">
            <span className="bt-scratch-unlocked-tag">✨ Revealed!</span>
            <button
              type="button"
              className="bt-quick-reveal-btn"
              onClick={initFoil}
            >
              <RotateCcw size={12} />
              <span>Scratch again</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
