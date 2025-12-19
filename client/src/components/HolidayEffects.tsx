import { useEffect, useState, useMemo } from 'react';
import { detectHoliday, type Holiday } from '@/lib/holidays';

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
}

function Snowflake({ particle }: { particle: Particle }) {
  return (
    <div
      className="fixed pointer-events-none text-white/30 animate-fall z-0"
      style={{
        left: `${particle.x}%`,
        animationDelay: `${particle.delay}s`,
        animationDuration: `${particle.duration}s`,
        fontSize: `${particle.size}px`,
      }}
    >
      ❄
    </div>
  );
}

function Ghost({ particle }: { particle: Particle }) {
  return (
    <div
      className="fixed pointer-events-none text-white/20 animate-fall z-0"
      style={{
        left: `${particle.x}%`,
        animationDelay: `${particle.delay}s`,
        animationDuration: `${particle.duration}s`,
        fontSize: `${particle.size}px`,
      }}
    >
      👻
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
      {particles.map((particle) =>
        holiday === 'christmas' ? (
          <Snowflake key={particle.id} particle={particle} />
        ) : (
          <Ghost key={particle.id} particle={particle} />
        )
      )}
    </div>
  );
}
