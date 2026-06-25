import { useEffect, useMemo, useState } from "react";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function splitTime(ms) {
  const safeMs = Math.max(0, ms);
  const days = Math.floor(safeMs / DAY);
  const hours = Math.floor((safeMs % DAY) / HOUR);
  const minutes = Math.floor((safeMs % HOUR) / MINUTE);
  const seconds = Math.floor((safeMs % MINUTE) / SECOND);

  return { days, hours, minutes, seconds };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

export function CountdownTimer({ targetDate, onComplete }) {
  const targetTime = useMemo(() => new Date(targetDate).getTime(), [targetDate]);
  const [remainingMs, setRemainingMs] = useState(() => targetTime - Date.now());
  const time = splitTime(remainingMs);

  useEffect(() => {
    const tick = () => setRemainingMs(targetTime - Date.now());
    tick();

    const intervalId = window.setInterval(tick, SECOND);
    return () => window.clearInterval(intervalId);
  }, [targetTime]);

  useEffect(() => {
    if (remainingMs <= 0) onComplete?.();
  }, [onComplete, remainingMs]);

  if (remainingMs <= 0) {
    return (
      <div className="countdown countdown--ready">
        <strong>00:00:00</strong>
        <span>Trứng đã sẵn sàng mở</span>
      </div>
    );
  }

  return (
    <div className="countdown" aria-label="Thời gian đếm ngược mở trứng">
      <div>
        <strong>{time.days}</strong>
        <span>Ngày</span>
      </div>
      <div>
        <strong>{pad(time.hours)}</strong>
        <span>Giờ</span>
      </div>
      <div>
        <strong>{pad(time.minutes)}</strong>
        <span>Phút</span>
      </div>
      <div>
        <strong>{pad(time.seconds)}</strong>
        <span>Giây</span>
      </div>
    </div>
  );
}
