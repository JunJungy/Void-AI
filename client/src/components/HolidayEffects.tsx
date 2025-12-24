import { useEffect, useState, useMemo } from 'react';
import { detectHoliday, type Holiday } from '@/lib/holidays';

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
}

const HOLIDAY_EMOJIS: Record<Exclude<Holiday, null>, string> = {
  christmas: '❄',
  halloween: '👻',
  thanksgiving: '🍂',
  valentines: '💕',
  newyear: '✨',
  july4th: '🎆',
  stpatricks: '☘',
};

const HOLIDAY_OPACITY: Record<Exclude<Holiday, null>, string> = {
  christmas: 'text-white/30',
  halloween: 'text-white/20',
  thanksgiving: 'text-orange-400/30',
  valentines: 'text-pink-400/40',
  newyear: 'text-yellow-400/40',
  july4th: 'text-white/30',
  stpatricks: 'text-green-400/40',
};

function FallingParticle({ particle, holiday }: { particle: Particle; holiday: Exclude<Holiday, null> }) {
  return (
    <div
      className={`fixed pointer-events-none animate-fall z-0 ${HOLIDAY_OPACITY[holiday]}`}
      style={{
        left: `${particle.x}%`,
        animationDelay: `${particle.delay}s`,
        animationDuration: `${particle.duration}s`,
        fontSize: `${particle.size}px`,
      }}
    >
      {HOLIDAY_EMOJIS[holiday]}
    </div>
  );
}

export function HolidayEffects() {
  const [holiday, setHoliday] = useState<Holiday>(null);

  useEffect(() => {
    setHoliday(detectHoliday());
  }, []);

  const particles = useMemo(() => {
    if (!holiday) return [];
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 8 + Math.random() * 8,
      size: 16 + Math.random() * 16,
    }));
  }, [holiday]);

  if (!holiday) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <FallingParticle key={particle.id} particle={particle} holiday={holiday} />
      ))}
    </div>
  );
}
