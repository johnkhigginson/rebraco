interface AmenityListProps {
  items: string[];
  title?: string;
}

export default function AmenityList({ items, title }: AmenityListProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      {title && (
        <h3 className="text-xl font-bold text-heading mb-4">{title}</h3>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2.5 py-1.5">
            <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-text">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
