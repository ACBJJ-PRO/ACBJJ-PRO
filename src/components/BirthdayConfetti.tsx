import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface BirthdayConfettiProps {
  onComplete?: () => void;
}

export const BirthdayConfetti: React.FC<BirthdayConfettiProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a canvas-confetti instance tied directly to our canvas element
    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });

    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;

    // Adjust particle count according to device specs for smooth FPS
    const countMultiplier = isMobile ? 0.45 : isTablet ? 0.75 : 1.0;

    // ACBJJ PRO Identity Colors: Gold, Red, White, Blue, Silver, Orange
    const colors = [
      '#FFD700', // Dourado
      '#EF4444', // Vermelho
      '#FFFFFF', // Branco
      '#3B82F6', // Azul
      '#E5E7EB', // Prata
      '#F97316', // Laranja
    ];

    // Explosions from top-left and top-right
    const fireCornerCannons = () => {
      // Top-Left Cannon
      myConfetti({
        particleCount: Math.round(75 * countMultiplier),
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.2 },
        colors,
        ticks: 320,
        gravity: 0.75,
        scalar: isMobile ? 0.8 : 1.05,
        drift: 0.15,
      });

      // Top-Right Cannon
      myConfetti({
        particleCount: Math.round(75 * countMultiplier),
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.2 },
        colors,
        ticks: 320,
        gravity: 0.75,
        scalar: isMobile ? 0.8 : 1.05,
        drift: -0.15,
      });
    };

    // Secondary subtle bursts from sides for depth
    const fireSecondaryCannons = () => {
      myConfetti({
        particleCount: Math.round(35 * countMultiplier),
        angle: 75,
        spread: 55,
        origin: { x: 0.05, y: 0.65 },
        colors,
        ticks: 280,
        gravity: 0.7,
        scalar: isMobile ? 0.7 : 0.9,
      });

      myConfetti({
        particleCount: Math.round(35 * countMultiplier),
        angle: 105,
        spread: 55,
        origin: { x: 0.95, y: 0.65 },
        colors,
        ticks: 280,
        gravity: 0.7,
        scalar: isMobile ? 0.7 : 0.9,
      });
    };

    // 1. Initial burst at modal open
    fireCornerCannons();

    // 2. Secondary lower-side burst after 350ms
    const timer1 = setTimeout(() => {
      fireSecondaryCannons();
    }, 350);

    // 3. Gentle follow-up stream at 1.1s
    const timer2 = setTimeout(() => {
      fireCornerCannons();
    }, 1100);

    // 4. Subtle secondary burst at 2.1s
    const timer3 = setTimeout(() => {
      fireSecondaryCannons();
    }, 2100);

    // 5. Cleanup timer at 5s
    const endTimer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(endTimer);
      myConfetti.reset();
    };
  }, [onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[1190] overflow-hidden"
    />
  );
};

export default BirthdayConfetti;
