import React from 'react';

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-white/5 rounded-md ${className}`} />
);

export default Skeleton;

// Reusable "Card" Skeleton for your Dashboard
export const StatCardSkeleton = () => (
  <div className="p-5 bg-overdrive-dark border border-white/5 rounded-xl space-y-4">
    <Skeleton className="h-3 w-24" /> {/* Label */}
    <Skeleton className="h-8 w-32" />  {/* Big Number */}
    <div className="flex gap-2">
      <Skeleton className="h-4 w-10" /> {/* Mini badge */}
      <Skeleton className="h-4 w-20" /> {/* Subtext */}
    </div>
  </div>
);