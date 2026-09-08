import type { BlockContentProps, LinkItem } from '../../types/blocks';
import { CmsLink } from '../../lib/links';

interface CtaStripData {
  heading?: string;
  text?: string;
  primaryCta?: LinkItem[] | null;
  secondaryCta?: LinkItem[] | null;
}

export default function CtaStrip({ data }: BlockContentProps<CtaStripData>) {
  return (
    <div className="max-w-4xl mx-auto text-center">
      {data.heading && (
        <h2 className="text-3xl md:text-4xl font-bold text-heading mb-4">{data.heading}</h2>
      )}
      {data.text && (
        <p className="text-lg text-text-muted mb-8 max-w-2xl mx-auto">{data.text}</p>
      )}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {data.primaryCta?.[0] && (
          <CmsLink
            link={data.primaryCta[0]}
            className="btn btn-primary"
          />
        )}
        {data.secondaryCta?.[0] && (
          <CmsLink
            link={data.secondaryCta[0]}
            className="btn btn-secondary"
          />
        )}
      </div>
    </div>
  );
}
