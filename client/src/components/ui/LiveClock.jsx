import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const LiveClock = ({ className = "" }) => {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      aria-label="Current system date and time"
      className={`flex items-center gap-2 bg-slate-50 dark:bg-black/20 px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 dark:border-white/10 w-full sm:w-auto text-slate-700 dark:text-slate-300 font-mono tabular-nums text-xs sm:text-sm font-bold justify-center sm:justify-start shadow-2xs ${className}`}
    >
      <Clock
        size={16}
        aria-hidden="true"
        className="text-amber-500 dark:text-overdrive-yellow shrink-0"
      />
      <time dateTime={time.toISOString()} className="truncate">
        {time.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}{" "}
        | {time.toLocaleTimeString()}
      </time>
    </div>
  );
};

export default LiveClock;
