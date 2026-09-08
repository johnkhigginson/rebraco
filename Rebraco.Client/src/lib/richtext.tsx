import type { RichTextValue } from '../types/blocks';
import { sanitizeHtml } from './sanitize';

interface RichTextProps {
  value?: RichTextValue | null;
  className?: string;
}

/** Renders Umbraco Rich Text content safely */
export function RichText({ value, className }: RichTextProps) {
  if (!value?.markup) return null;
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(value.markup) }}
    />
  );
}
