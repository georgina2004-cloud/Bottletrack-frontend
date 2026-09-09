import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartSkeletonProps {
  className?: string;
  height?: string;
  title?: string;
}

export function ChartSkeleton({
  className = "",
  height = "h-[360px]",
}: ChartSkeletonProps) {
  return (
    <div
      className={`bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between ${height} ${className}`}
    >
      {/* Header Skeleton */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="h-3.5 w-56 rounded-md" />
        </div>
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>

      {/* Main Chart Graphic Skeleton Area */}
      <div className="flex-1 w-full flex items-end justify-between gap-3 px-2 py-4 bg-slate-50/50 rounded-2xl border border-slate-100">
        <div className="w-full flex items-end justify-around gap-2 h-full pt-4">
          <Skeleton className="w-[10%] h-[40%] rounded-t-lg" />
          <Skeleton className="w-[10%] h-[65%] rounded-t-lg" />
          <Skeleton className="w-[10%] h-[85%] rounded-t-lg" />
          <Skeleton className="w-[10%] h-[50%] rounded-t-lg" />
          <Skeleton className="w-[10%] h-[75%] rounded-t-lg" />
          <Skeleton className="w-[10%] h-[95%] rounded-t-lg" />
          <Skeleton className="w-[10%] h-[60%] rounded-t-lg" />
        </div>
      </div>

      {/* Footer / Legend Skeleton */}
      <div className="flex items-center justify-end gap-4 mt-4 pt-3 border-t border-slate-100">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-3 w-28 rounded-md" />
      </div>
    </div>
  );
}

export default ChartSkeleton;