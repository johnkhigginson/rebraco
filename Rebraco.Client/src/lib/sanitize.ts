import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content from the CMS.
 * Strips scripts, event handlers, and other dangerous content.
 * Use for rich text, embed codes, and any user-facing HTML.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target'],
  });
}
