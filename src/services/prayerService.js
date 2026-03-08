const PRAYER_API_BASE = 'https://api.aladhan.com/v1/timings';

function toDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toApiDate(date = new Date()) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

function parseTimeToDate(date, timeText) {
  const clean = (timeText || '').replace(/[^\d:]/g, '');
  const [hourText, minuteText] = clean.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute,
    0,
    0
  );
}

export async function fetchDailyPrayerTimes({ latitude, longitude, date = new Date() }) {
  const url = new URL(`${PRAYER_API_BASE}/${toApiDate(date)}`);
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('method', '4'); // Umm al-Qura

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Unable to fetch prayer times');
  }

  const payload = await response.json();
  const timings = payload?.data?.timings;
  if (!timings) {
    throw new Error('Invalid prayer timing payload');
  }

  const prayers = [
    { id: 'fajr', label: 'الفجر', date: parseTimeToDate(date, timings.Fajr) },
    { id: 'dhuhr', label: 'الظهر', date: parseTimeToDate(date, timings.Dhuhr) },
    { id: 'asr', label: 'العصر', date: parseTimeToDate(date, timings.Asr) },
    { id: 'maghrib', label: 'المغرب', date: parseTimeToDate(date, timings.Maghrib) },
    { id: 'isha', label: 'العشاء', date: parseTimeToDate(date, timings.Isha) },
  ].filter((item) => item.date);

  return {
    dateKey: toDateKey(date),
    prayers,
    timezone: payload?.data?.meta?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export function getDateKey(date = new Date()) {
  return toDateKey(date);
}
