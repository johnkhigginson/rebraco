export function PageSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="h-80 bg-slate-200" />
      {/* Content skeleton */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <div className="h-8 bg-slate-200 rounded w-2/3" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-5/6" />
          <div className="h-4 bg-slate-200 rounded w-4/6" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <div className="h-48 bg-slate-200 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BlockSkeleton() {
  return (
    <div className="animate-pulse py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-200 rounded w-full" />
        <div className="h-4 bg-slate-200 rounded w-5/6" />
      </div>
    </div>
  );
}
