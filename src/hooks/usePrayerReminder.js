import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDailyPrayerTimes, getDateKey } from '../services/prayerService';

const ALERT_STORAGE_KEY = 'suhba_prayer_alerts_v1';
const CHECK_MS = 30 * 1000;
const ALERT_WINDOW_MS = 60 * 1000;

function readAlerts() {
  try {
    const raw = localStorage.getItem(ALERT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAlerts(map) {
  localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(map));
}

function prayerAlertKey(dayKey, prayerId) {
  return `${dayKey}:${prayerId}`;
}

export function usePrayerReminder({ enabled }) {
  const [location, setLocation] = useState(null);
  const [dayKey, setDayKey] = useState(getDateKey(new Date()));
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [reminder, setReminder] = useState(null);

  const loadPrayerTimesForCoords = useCallback(async (coords) => {
    if (!enabled || !coords) return;
    try {
      const today = new Date();
      const result = await fetchDailyPrayerTimes({
        latitude: coords.latitude,
        longitude: coords.longitude,
        date: today,
      });
      setDayKey(result.dateKey);
      setPrayers(result.prayers);
    } catch (err) {
      console.error('Prayer timing load error:', err);
      setLocationError('تعذر جلب أوقات الصلاة حالياً.');
    }
  }, [enabled]);

  const requestLocation = useCallback(() => {
    if (!enabled || !navigator.geolocation) {
      setLocationError('متصفحك لا يدعم تحديد الموقع لتفعيل تنبيهات الصلاة.');
      return;
    }

    setLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(coords);
        await loadPrayerTimesForCoords(coords);
        setLoading(false);
      },
      () => {
        setLocationError('تعذر الوصول للموقع. فعّل إذن الموقع لتنبيهات الصلاة.');
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 }
    );
  }, [enabled, loadPrayerTimesForCoords]);

  useEffect(() => {
    if (enabled) {
      const id = setTimeout(() => {
        requestLocation();
      }, 0);
      return () => clearTimeout(id);
    }
  }, [enabled, requestLocation]);

  useEffect(() => {
    if (!enabled || prayers.length === 0) return;

    const timer = setInterval(() => {
      const now = new Date();
      const todayKey = getDateKey(now);

      if (todayKey !== dayKey) {
        setDayKey(todayKey);
        setReminder(null);
        loadPrayerTimesForCoords(location);
        return;
      }

      const alertedMap = readAlerts();

      for (const prayer of prayers) {
        const key = prayerAlertKey(todayKey, prayer.id);
        if (alertedMap[key]) continue;

        const diff = now.getTime() - prayer.date.getTime();
        if (diff >= 0 && diff <= ALERT_WINDOW_MS) {
          alertedMap[key] = true;
          writeAlerts(alertedMap);
          setReminder({
            id: key,
            prayerId: prayer.id,
            prayerLabel: prayer.label,
            prayerTime: prayer.date,
          });
          break;
        }
      }
    }, CHECK_MS);

    return () => clearInterval(timer);
  }, [dayKey, enabled, loadPrayerTimesForCoords, location, prayers]);

  const dismissReminder = useCallback(() => {
    setReminder(null);
  }, []);

  const nextPrayer = useMemo(() => {
    const now = new Date().getTime();
    return prayers.find((item) => item.date.getTime() > now) || null;
  }, [prayers]);

  return {
    loading,
    locationError,
    requestLocation,
    reminder,
    dismissReminder,
    nextPrayer,
  };
}
