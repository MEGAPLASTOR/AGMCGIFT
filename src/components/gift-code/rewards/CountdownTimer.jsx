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

export function CountdownTimer({
  targetDate,
  onComplete,
  readyMessage = "Tr\u1ee9ng \u0111\u00e3 s\u1eb5n s\u00e0ng m\u1edf",
  ariaLabel = "Th\u1eddi gian \u0111\u1ebfm ng\u01b0\u1ee3c",
}) {
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
        <span>{readyMessage}</span>
      </div>
    );
  }

  return (
    <div className="countdown" aria-label={ariaLabel}>
      <div>
        <strong>{time.days}</strong>
        <span>{"Ng\u00e0y"}</span>
      </div>
      <div>
        <strong>{pad(time.hours)}</strong>
        <span>{"Gi\u1edd"}</span>
      </div>
      <div>
        <strong>{pad(time.minutes)}</strong>
        <span>{"Ph\u00fat"}</span>
      </div>
      <div>
        <strong>{pad(time.seconds)}</strong>
        <span>{"Gi\u00e2y"}</span>
      </div>
    </div>
  );
}
