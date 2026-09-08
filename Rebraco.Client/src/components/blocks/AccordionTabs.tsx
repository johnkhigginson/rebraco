import { useState } from 'react';
import type { BlockContentProps, RichTextValue } from '../../types/blocks';
import { RichText } from '../../lib/richtext';

interface AccordionItem {
  content: {
    properties: {
      title?: string;
      content?: RichTextValue | null;
    };
  };
}

interface AccordionTabsData {
  displayMode?: string;
  heading?: string;
  items?: {
    items: AccordionItem[];
  };
}

export default function AccordionTabs({ data }: BlockContentProps<AccordionTabsData>) {
  const items = data.items?.items || [];
  const [activeIndex, setActiveIndex] = useState<number>(0);

  if (items.length === 0) return null;

  const isTabMode = data.displayMode === 'tabs';

  return (
    <div className="max-w-4xl mx-auto">
      {data.heading && (
        <h2 className="text-3xl font-bold text-heading mb-8">{data.heading}</h2>
      )}

      {isTabMode ? (
        <TabView items={items} activeIndex={activeIndex} setActiveIndex={setActiveIndex} />
      ) : (
        <AccordionView items={items} />
      )}
    </div>
  );
}

function AccordionView({ items }: { items: AccordionItem[] }) {
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set([0]));

  const toggle = (index: number) => {
    setOpenIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="divide-y divide-border border border-border rounded-[var(--border-radius,0.75rem)] overflow-hidden">
      {items.map((item, i) => {
        const isOpen = openIndices.has(i);
        return (
          <div key={i}>
            <button
              className="w-full px-6 py-4 text-left flex items-center justify-between bg-bg hover:bg-surface transition"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-heading">
                {item.content.properties.title}
              </span>
              <svg
                className={`w-5 h-5 text-text-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="accordion-content" data-open={isOpen}>
              <div>
                <div className="px-6 py-4 bg-surface">
                  <RichText
                    value={item.content.properties.content}
                    className="prose prose-headings:text-heading prose-p:text-text-muted"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabView({
  items,
  activeIndex,
  setActiveIndex,
}: {
  items: AccordionItem[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
}) {
  return (
    <div>
      <div className="flex border-b border-border overflow-x-auto">
        {items.map((item, i) => (
          <button
            key={i}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 ${
              i === activeIndex
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-heading'
            }`}
            onClick={() => setActiveIndex(i)}
          >
            {item.content.properties.title}
          </button>
        ))}
      </div>
      <div className="py-6">
        <RichText
          value={items[activeIndex]?.content.properties.content}
          className="prose prose-headings:text-heading prose-p:text-text-muted"
        />
      </div>
    </div>
  );
}
