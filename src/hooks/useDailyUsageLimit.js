import { useEffect, useMemo, useState } from 'react';
import { getDateKey } from '../services/prayerService';

const STORAGE_KEY = 'suhba_daily_usage_v1';
const DEFAULT_LIMIT_MS = 3 * 60 * 60 * 1000;
const TICK_MS = 1000;

function readStorage(todayKey) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { dayKey: todayKey, usedMs: 0 };
    }
    const parsed = JSON.parse(raw);
    if (parsed?.dayKey !== todayKey) {
      return { dayKey: todayKey, usedMs: 0 };
    }
    return {
      dayKey: parsed.dayKey,
      usedMs: Number(parsed.usedMs) || 0,
    };
  } catch {
    return { dayKey: todayKey, usedMs: 0 };
  }
}

function writeStorage(dayKey, usedMs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ dayKey, usedMs }));
}

function getMidnight() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
}

export function useDailyUsageLimit({ enabled, limitMs = DEFAULT_LIMIT_MS }) {
  const [dayKey, setDayKey] = useState(() => {
    const todayKey = getDateKey(new Date());
    return readStorage(todayKey).dayKey;
  });
  const [usedMs, setUsedMs] = useState(() => {
    const todayKey = getDateKey(new Date());
    return readStorage(todayKey).usedMs;
  });

  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(() => {
      const todayKey = getDateKey(new Date());

      if (todayKey !== dayKey) {
        setDayKey(todayKey);
        setUsedMs(0);
        writeStorage(todayKey, 0);
        return;
      }

      if (document.visibilityState !== 'visible' || !document.hasFocus()) {
        return;
      }

      setUsedMs((prev) => {
        const next = Math.min(limitMs, prev + TICK_MS);
        writeStorage(todayKey, next);
        return next;
      });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [dayKey, enabled, limitMs]);

  const locked = usedMs >= limitMs;
  const remainingMs = Math.max(0, limitMs - usedMs);
  const resetAt = useMemo(() => getMidnight(), []);

  return {
    locked,
    usedMs,
    remainingMs,
    limitMs,
    resetAt,
  };
}
