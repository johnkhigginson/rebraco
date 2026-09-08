import { Link } from 'react-router';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-text-muted mb-6 overflow-x-auto">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2 shrink-0">
          {i > 0 && (
            <svg className="w-4 h-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {item.path && i < items.length - 1 ? (
            <Link to={item.path} className="hover:text-primary transition">
              {item.label}
            </Link>
          ) : (
            <span className={i === items.length - 1 ? 'text-text font-medium' : ''}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
