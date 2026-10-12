import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const LiveClock = ({ className = "" }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`flex items-center gap-2 bg-slate-50 dark:bg-black/20 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 w-full sm:w-auto text-slate-700 dark:text-slate-300 font-mono text-xs sm:text-sm font-bold justify-center sm:justify-start shadow-sm ${className}`}
    >
      <Clock size={16} className="text-amber-500 shrink-0" />
      <span>
        {time.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}{" "}
        | {time.toLocaleTimeString()}
      </span>
    </div>
  );
};

export default LiveClock;
