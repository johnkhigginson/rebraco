import type { ReactNode } from 'react';

interface PageLayoutProps {
  layout?: string;
  children: ReactNode;
  sidebar?: ReactNode;
}

export default function PageLayout({ layout, children, sidebar }: PageLayoutProps) {
  if (layout === 'leftSidebar' || layout === 'rightSidebar') {
    const gridClass = layout === 'leftSidebar'
      ? 'grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8'
      : 'grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8';

    return (
      <div className={`${gridClass} max-w-7xl mx-auto px-6 py-12`}>
        {layout === 'leftSidebar' && <aside className="space-y-6">{sidebar}</aside>}
        <div>{children}</div>
        {layout === 'rightSidebar' && <aside className="space-y-6">{sidebar}</aside>}
      </div>
    );
  }

  // fullWidth (default)
  return <div>{children}</div>;
}
