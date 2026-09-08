import { useState } from 'react';
import type { BlockContentProps, RichTextValue } from '../../types/blocks';
import { RichText } from '../../lib/richtext';

interface AlertBoxData {
  alertType?: string;
  heading?: string;
  text?: RichTextValue | null;
  dismissible?: boolean;
}

const ALERT_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z' },
  error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
};

export default function AlertBox({ data }: BlockContentProps<AlertBoxData>) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const style = ALERT_STYLES[data.alertType || 'info'] || ALERT_STYLES.info;

  return (
    <div className="max-w-4xl mx-auto">
      <div className={`${style.bg} ${style.border} ${style.text} border rounded-[var(--border-radius,0.75rem)] p-6 flex gap-4`}>
        <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.icon} />
        </svg>
        <div className="flex-grow">
          {data.heading && (
            <h3 className="font-semibold mb-1">{data.heading}</h3>
          )}
          <RichText value={data.text} className="prose prose-sm" />
        </div>
        {data.dismissible && (
          <button
            className="flex-shrink-0 opacity-50 hover:opacity-100 transition"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Note: AlertBox intentionally uses hardcoded Tailwind alert colors (blue/green/amber/red)
// since these are semantic status colors that shouldn't change with the design token theme.
