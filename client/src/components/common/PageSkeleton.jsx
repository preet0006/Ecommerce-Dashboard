import React from 'react';

export default function PageSkeleton() {
  return (
    <div className="min-h-[80vh] p-4 sm:p-6 flex flex-col gap-5 animate-enter">
      {/* Top Breadcrumb & Title Skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-4 w-36 rounded-md bg-surface-raised animate-pulse" />
        <div className="h-8 w-64 rounded-lg bg-surface-raised animate-pulse" />
      </div>

      {/* KPI Cards Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="card p-5 flex flex-col gap-3 border border-border bg-surface shadow-2xs"
          >
            <div className="h-3.5 w-24 rounded bg-surface-raised animate-pulse" />
            <div className="h-7 w-32 rounded bg-surface-raised animate-pulse" />
            <div className="h-3 w-20 rounded bg-surface-raised/70 animate-pulse mt-1" />
          </div>
        ))}
      </div>

      {/* Main Table / Content Skeleton */}
      <div className="card p-6 flex flex-col gap-4 border border-border bg-surface shadow-2xs">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="h-9 w-64 rounded-lg bg-surface-raised animate-pulse" />
          <div className="h-9 w-28 rounded-lg bg-surface-raised animate-pulse" />
        </div>
        <div className="flex flex-col gap-3 pt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-border/40">
              <div className="h-4 w-16 rounded bg-surface-raised animate-pulse" />
              <div className="h-4 w-48 rounded bg-surface-raised animate-pulse flex-1" />
              <div className="h-4 w-20 rounded bg-surface-raised animate-pulse" />
              <div className="h-4 w-16 rounded bg-surface-raised animate-pulse" />
              <div className="h-6 w-20 rounded-full bg-surface-raised animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
