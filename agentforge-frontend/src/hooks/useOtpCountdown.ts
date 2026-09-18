// src/hooks/useOtpCountdown.ts — 10-minute OTP validity countdown with a
// 60-second gate before a resend is allowed.

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseOtpCountdown {
  remaining: number;
  canResend: boolean;
  reset: () => void;
  format: (seconds?: number) => string;
}

export function useOtpCountdown(
  totalSeconds = 600,
  resendAfterSeconds = 60
): UseOtpCountdown {
  const [remaining, setRemaining] = useState(totalSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(totalSeconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalSeconds]);

  const reset = useCallback(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  const format = useCallback((seconds?: number) => {
    const s = Math.max(0, seconds ?? remaining);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, [remaining]);

  const elapsed = totalSeconds - Math.max(0, remaining);
  const canResend = elapsed >= resendAfterSeconds;

  return { remaining, canResend, reset, format };
}