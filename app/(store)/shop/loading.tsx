export default function Loading() {
  return (
    <div className="container-x pb-10 pt-36 sm:pt-44">
      <div className="skeleton h-4 w-40 rounded" />
      <div className="skeleton mt-6 h-24 w-2/3 rounded-2xl" />
      <div className="mt-16 grid gap-10 lg:grid-cols-[260px_1fr]">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-10 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton aspect-[4/5] rounded-[22px]" />
              <div className="skeleton mt-4 h-4 w-2/3 rounded" />
              <div className="skeleton mt-2 h-4 w-1/3 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
