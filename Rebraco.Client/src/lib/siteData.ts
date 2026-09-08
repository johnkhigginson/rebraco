/**
 * Pure parsing functions for site-level data.
 * Extracted from SiteContext so they can be called from route loaders (SSR).
 */

import type { GeneralData } from './scripts';
import { resolveMediaUrl } from './utils';

// --- Types ---

export interface NavigationData {
  headerVariant: string;
  stickyHeader: boolean;
  primaryNav: Array<{ url: string; name: string; target?: string }>;
  ctaButton: { url: string; name: string } | null;
}

export interface FooterData {
  footerText: string;
  footerLinks: Array<{ url: string; name: string }>;
  copyrightText: string;
  socialLinks: Array<{ platform: string; url: string }>;
}

// --- Parsers ---

export function parseNavigation(props: Record<string, any>): NavigationData {
  const navLinks = props.primaryNav || [];
  const ctaLinks = props.ctaButton || [];

  return {
    headerVariant: props.headerVariant?.[0] || props.headerVariant || 'standard',
    stickyHeader: props.stickyHeader ?? true,
    primaryNav: navLinks.map((link: any) => ({
      url: link.url || link.route?.path || '/',
      name: link.name || link.title || 'Link',
      target: link.target || undefined,
    })),
    ctaButton: ctaLinks.length > 0
      ? { url: ctaLinks[0].url || '/', name: ctaLinks[0].name || 'CTA' }
      : null,
  };
}

export function parseFooter(props: Record<string, any>): FooterData {
  const socialItems = props.socialLinks?.items || [];

  return {
    footerText: props.footerText?.markup || '',
    footerLinks: (props.footerLinks || []).map((link: any) => ({
      url: link.url || '/',
      name: link.name || link.title || 'Link',
    })),
    copyrightText: props.copyrightText || `\u00A9 ${new Date().getFullYear()} Rebraco`,
    socialLinks: socialItems.map((item: any) => {
      const p = item.content?.properties || {};
      return {
        platform: p.platform?.[0] || p.platform || '',
        url: p.url?.url || p.url || '',
      };
    }),
  };
}

export function parseGeneral(props: Record<string, any>, mediaBaseUrl?: string): GeneralData {
  return {
    websiteName: props.websiteName || '',
    defaultSocialShareImage: resolveMediaUrl(props.defaultSocialShareImage?.[0]?.url, mediaBaseUrl),
    googleTagManagerId: props.googleTagManagerId || '',
    googleAnalyticsId: props.googleAnalyticsId || '',
    headerOpeningScripts: props.headerOpeningScripts || '',
    headerClosingScripts: props.headerClosingScripts || '',
    bodyOpeningScripts: props.bodyOpeningScripts || '',
    bodyClosingScripts: props.bodyClosingScripts || '',
  };
}
