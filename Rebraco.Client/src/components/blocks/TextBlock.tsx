import type { BlockContentProps, RichTextValue } from '../../types/blocks';
import { RichText } from '../../lib/richtext';

interface TextBlockData {
  heading?: string;
  headingLevel?: string;
  text?: RichTextValue | null;
  alignment?: string;
}

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4';
const VALID_HEADINGS: HeadingTag[] = ['h1', 'h2', 'h3', 'h4'];

export default function TextBlock({ data }: BlockContentProps<TextBlockData>) {
  const level = VALID_HEADINGS.includes(data.headingLevel as HeadingTag)
    ? (data.headingLevel as HeadingTag)
    : 'h2';
  const align = data.alignment === 'center' ? 'text-center' : data.alignment === 'right' ? 'text-right' : 'text-left';

  const headingEl = data.heading
    ? (() => {
        const cls = "text-3xl md:text-4xl font-bold text-heading mb-6";
        switch (level) {
          case 'h1': return <h1 className={cls}>{data.heading}</h1>;
          case 'h3': return <h3 className={cls}>{data.heading}</h3>;
          case 'h4': return <h4 className={cls}>{data.heading}</h4>;
          default: return <h2 className={cls}>{data.heading}</h2>;
        }
      })()
    : null;

  return (
    <div className={`max-w-4xl mx-auto ${align}`}>
      {headingEl}
      <RichText
        value={data.text}
        className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-heading prose-p:text-text-muted"
      />
    </div>
  );
}
