import React from 'react';
import { BellRing, MapPin, X } from 'lucide-react';

function formatPrayerTime(date) {
  return new Intl.DateTimeFormat('ar', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

const PrayerReminderBanner = ({
  reminder,
  nextPrayer,
  locationError,
  onDismiss,
  onRetryLocation,
  loadingLocation,
}) => {
  if (reminder) {
    return (
      <div className="prayer-banner prayer-banner-active">
        <div className="prayer-banner-main">
          <BellRing size={18} />
          <span>
            حان وقت صلاة <strong>{reminder.prayerLabel}</strong> ({formatPrayerTime(reminder.prayerTime)})
            {' '} - قوم صلّي.
          </span>
        </div>
        <button className="prayer-banner-btn" onClick={onDismiss}>
          تم
        </button>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="prayer-banner prayer-banner-warning">
        <div className="prayer-banner-main">
          <MapPin size={18} />
          <span>{locationError}</span>
        </div>
        <button className="prayer-banner-btn" onClick={onRetryLocation} disabled={loadingLocation}>
          {loadingLocation ? 'جارٍ المحاولة...' : 'إعادة المحاولة'}
        </button>
      </div>
    );
  }

  if (!nextPrayer) return null;

  return (
    <div className="prayer-banner prayer-banner-subtle">
      <div className="prayer-banner-main">
        <BellRing size={16} />
        <span>
          الصلاة القادمة: <strong>{nextPrayer.label}</strong> عند {formatPrayerTime(nextPrayer.date)}
        </span>
      </div>
      <button className="prayer-banner-close" onClick={onDismiss} aria-label="إغلاق">
        <X size={16} />
      </button>
    </div>
  );
};

export default PrayerReminderBanner;
