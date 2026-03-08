import React, { useEffect, useState } from 'react';
import { Clock3, MoonStar } from 'lucide-react';

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const UsageLockOverlay = ({ resetAt }) => {
  const [remainingToReset, setRemainingToReset] = useState(() => resetAt.getTime());

  useEffect(() => {
    const id = setInterval(() => {
      setRemainingToReset(Math.max(0, resetAt.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [resetAt]);

  return (
    <div className="usage-lock-screen">
      <div className="usage-lock-card">
        <div className="usage-lock-icon">
          <MoonStar size={36} />
        </div>
        <h2>انتهى حد الاستخدام اليومي</h2>
        <p>
          تم إيقاف التطبيق مؤقتاً بعد 3 ساعات استخدام اليوم لحماية وقتك.
          <br />
          ارجع غداً بإذن الله.
        </p>

        <div className="usage-lock-countdown">
          <Clock3 size={18} />
          <span>الوقت المتبقي لإعادة الفتح: {formatDuration(remainingToReset)}</span>
        </div>
      </div>
    </div>
  );
};

export default UsageLockOverlay;
