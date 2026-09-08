import { Link } from 'react-router';
import type { LinkItem } from '../types/blocks';
import type { ReactNode } from 'react';

interface CmsLinkProps {
  link?: LinkItem | null;
  className?: string;
  children?: ReactNode;
}

/** Smart link: internal routes use React Router Link, external use <a> */
export function CmsLink({ link, className, children }: CmsLinkProps) {
  if (!link?.url) return null;

  const isInternal = link.type === 'content' || (!link.type && link.url.startsWith('/'));
  const label = children || link.name || link.title || 'Link';

  if (isInternal) {
    return (
      <Link to={link.url} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <a
      href={link.url}
      target={link.target || '_blank'}
      rel="noopener noreferrer"
      className={className}
    >
      {label}
    </a>
  );
}
