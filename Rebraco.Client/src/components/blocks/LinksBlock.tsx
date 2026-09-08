import type { BlockContentProps, LinkItem } from '../../types/blocks';
import { CmsLink } from '../../lib/links';

interface LinksBlockData {
  heading?: string;
  layout?: string;
  links?: LinkItem[] | null;
}

export default function LinksBlock({ data }: BlockContentProps<LinksBlockData>) {
  const links = data.links || [];
  if (links.length === 0) return null;

  const layout = data.layout || 'list';

  return (
    <div className="max-w-4xl mx-auto">
      {data.heading && (
        <h2 className="text-3xl font-bold text-heading mb-8">{data.heading}</h2>
      )}

      {layout === 'buttons' ? (
        <div className="flex flex-wrap gap-3">
          {links.map((link, i) => (
            <CmsLink
              key={i}
              link={link}
              className="btn btn-primary"
            />
          ))}
        </div>
      ) : layout === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link, i) => (
            <CmsLink
              key={i}
              link={link}
              className="card block !p-6 hover:border-primary transition group"
            >
              <span className="font-semibold text-heading group-hover:text-primary transition">
                {link.name} &rarr;
              </span>
            </CmsLink>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {links.map((link, i) => (
            <li key={i}>
              <CmsLink
                link={link}
                className="text-link hover:underline font-medium"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
