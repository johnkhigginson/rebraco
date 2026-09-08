import { useEffect, useState } from 'react';
import type { BlockContentProps } from '../../types/blocks';

interface AnchorNavItemData {
  content: {
    properties: {
      label?: string;
      targetAnchor?: string;
    };
  };
}

interface AnchorNavData {
  items?: {
    items: AnchorNavItemData[];
  };
  style?: string;
}

export default function AnchorNav({ data }: BlockContentProps<AnchorNavData>) {
  const items = data.items?.items || [];
  const [activeAnchor, setActiveAnchor] = useState<string>('');

  useEffect(() => {
    const anchors = items
      .map(item => item.content.properties.targetAnchor)
      .filter(Boolean) as string[];

    if (anchors.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveAnchor(entry.target.id);
          }
        }
      },
      { rootMargin: '-100px 0px -60% 0px' }
    );

    anchors.forEach(anchor => {
      const el = document.getElementById(anchor);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const handleClick = (anchor: string) => {
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navStyle = data.style || 'bar';

  return (
    <nav className="sticky top-16 z-40 bg-bg border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className={`flex ${navStyle === 'dots' ? 'justify-center gap-3 py-3' : 'gap-0 overflow-x-auto'}`}>
          {items.map((item, i) => {
            const anchor = item.content.properties.targetAnchor || '';
            const isActive = activeAnchor === anchor;

            if (navStyle === 'dots') {
              return (
                <button
                  key={i}
                  className={`w-3 h-3 rounded-full transition ${
                    isActive ? 'bg-primary' : 'bg-border hover:bg-text-muted'
                  }`}
                  onClick={() => handleClick(anchor)}
                  aria-label={item.content.properties.label}
                  title={item.content.properties.label}
                />
              );
            }

            return (
              <button
                key={i}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-muted hover:text-heading'
                }`}
                onClick={() => handleClick(anchor)}
              >
                {item.content.properties.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
