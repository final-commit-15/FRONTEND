import { useMemo } from 'react';

export function AuthParticles({ count = 52 }: { count?: number }) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const size = 1.1 + Math.random() * 3.2;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const duration = 11 + Math.random() * 14;
      const delay = -(Math.random() * duration);
      const drift = (Math.random() - 0.5) * 110;
      const opacity = 0.38 + Math.random() * 0.52;
      const twinkleDur = 1.9 + Math.random() * 2.6;
      const scale = 0.85 + Math.random() * 0.45;
      return { id: i, size, left, top, delay, duration, drift, opacity, twinkleDur, scale };
    });
  }, [count]);

  return (
    <div aria-hidden="true" className="login-particles">
      {particles.map((p) => (
        <span
          key={p.id}
          className="login-particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            ['--p-opacity' as unknown as string]: String(p.opacity),
            ['--drift' as unknown as string]: `${p.drift}px`,
            ['--p-scale' as unknown as string]: String(p.scale),
            animationDuration: `${p.duration}s, ${p.twinkleDur}s`,
            animationDelay: `${p.delay}s, ${p.delay * 0.35}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
