import React, { type ReactNode } from 'react';
import { useSite } from '../contexts/SiteContext';
import { ErrorBoundary } from './ErrorBoundary';
import { useScrollReveal } from '../lib/useScrollReveal';
import type { ComponentSettings } from '../types/blocks';
import Banner from './blocks/Banner';
import SplitContent from './blocks/SplitContent';
import Pods from './blocks/Pods';
import TextBlock from './blocks/TextBlock';
import CtaStrip from './blocks/CtaStrip';
import GridLayout from './blocks/GridLayout';
import AccordionTabs from './blocks/AccordionTabs';
import Gallery from './blocks/Gallery';
import AlertBox from './blocks/AlertBox';
import LinksBlock from './blocks/LinksBlock';
import EmbedBlock from './blocks/EmbedBlock';
import DataList from './blocks/DataList';
import AnchorNav from './blocks/AnchorNav';
import SubpageListing from './blocks/SubpageListing';
import FormBlock from './blocks/FormBlock';
import FeaturedProperties from './blocks/FeaturedProperties';
import PropertyGrid from './blocks/PropertyGrid';

// --- Block Item Shape from Umbraco Delivery API ---

interface BlockItem {
  content: {
    contentType: string;
    id: string;
    properties: Record<string, any>;
  };
  settings?: {
    contentType: string;
    properties: ComponentSettings;
  };
}

interface BlockRendererProps {
  content: {
    items: BlockItem[];
  };
}

// --- Component Registry ---

const COMPONENT_MAP: Record<string, React.FC<any>> = {
  'banner': Banner,
  'splitContent': SplitContent,
  'pods': Pods,
  'textBlock': TextBlock,
  'ctaStrip': CtaStrip,
  'gridLayout': GridLayout,
  'accordionTabs': AccordionTabs,
  'gallery': Gallery,
  'alertBox': AlertBox,
  'linksBlock': LinksBlock,
  'embedBlock': EmbedBlock,
  'dataList': DataList,
  'anchorNav': AnchorNav,
  'subpageListing': SubpageListing,
  'formBlock': FormBlock,
  'featuredProperties': FeaturedProperties,
  'propertyGrid': PropertyGrid,
};

// --- Padding Maps (using CSS custom property values from design tokens) ---

const PADDING_TOP_MAP: Record<string, string> = {
  none: 'pt-0',
  small: 'pt-[var(--spacing-sm,1.5rem)]',
  medium: 'pt-[var(--spacing-md,3rem)]',
  large: 'pt-[var(--spacing-lg,5rem)]',
  xl: 'pt-[var(--spacing-xl,8rem)]',
};

const PADDING_BOTTOM_MAP: Record<string, string> = {
  none: 'pb-0',
  small: 'pb-[var(--spacing-sm,1.5rem)]',
  medium: 'pb-[var(--spacing-md,3rem)]',
  large: 'pb-[var(--spacing-lg,5rem)]',
  xl: 'pb-[var(--spacing-xl,8rem)]',
};

const WIDTH_MAP: Record<string, string> = {
  full: 'w-full',
  wide: 'max-w-7xl mx-auto px-6',
  standard: 'max-w-5xl mx-auto px-6',
  narrow: 'max-w-3xl mx-auto px-6',
};

// --- Block Wrapper (applies settings to each block section) ---

function BlockWrapper({ settings, children, blockType }: { settings?: BlockItem['settings']; children: ReactNode; blockType?: string }) {
  const { getColorScheme } = useSite();
  const revealRef = useScrollReveal<HTMLElement>();

  const props = settings?.properties;

  // Hide component if toggled
  if (props?.hideComponent) return null;

  const scheme = props?.colorScheme ? getColorScheme(props.colorScheme) : undefined;

  // Banner shouldn't have scroll reveal (it's the first thing on page)
  const skipReveal = blockType === 'banner' || blockType === 'anchorNav';

  const sectionClasses = [
    PADDING_TOP_MAP[props?.paddingTop || ''] || '',
    PADDING_BOTTOM_MAP[props?.paddingBottom || ''] || '',
    props?.cssClasses || '',
  ].filter(Boolean).join(' ');

  const containerClass = WIDTH_MAP[props?.containerWidth || ''] || '';

  const style: Record<string, string> = {};
  if (scheme) {
    style['--section-bg'] = scheme.bgColor;
    style['--section-text'] = scheme.textColor;
    style['--section-heading'] = scheme.headingColor;
    style['--section-link'] = scheme.linkColor;
    style['--section-button-bg'] = scheme.buttonBgColor;
    style['--section-button-text'] = scheme.buttonTextColor;
    // Extended design tokens
    if (scheme.accentColor) style['--section-accent'] = scheme.accentColor;
    if (scheme.surfaceColor) style['--section-surface'] = scheme.surfaceColor;
    if (scheme.borderColor) style['--section-border'] = scheme.borderColor;
    if (scheme.mutedTextColor) style['--section-muted-text'] = scheme.mutedTextColor;
    if (scheme.dividerColor) style['--section-divider'] = scheme.dividerColor;
    if (scheme.inputBorderColor) style['--section-input-border'] = scheme.inputBorderColor;
    if (scheme.inputBgColor) style['--section-input-bg'] = scheme.inputBgColor;
    style.backgroundColor = scheme.bgColor;
    style.color = scheme.textColor;
  }

  return (
    <section
      ref={skipReveal ? undefined : (revealRef as React.Ref<HTMLElement>)}
      id={props?.anchorName || undefined}
      className={sectionClasses || undefined}
      style={Object.keys(style).length > 0 ? style : undefined}
    >
      {containerClass ? (
        <div className={containerClass}>{children}</div>
      ) : (
        children
      )}
    </section>
  );
}

// --- Block Renderer ---

const BlockRenderer: React.FC<BlockRendererProps> = ({ content }) => {
  if (!content?.items) return null;

  return (
    <div className="page-builder">
      {content.items.map((block) => {
        const Component = COMPONENT_MAP[block.content.contentType];

        if (!Component) {
          console.warn(`Unknown block: ${block.content.contentType}`);
          return null;
        }

        return (
          <ErrorBoundary key={block.content.id}>
            <BlockWrapper settings={block.settings} blockType={block.content.contentType}>
              <Component data={block.content.properties} settings={block.settings?.properties} />
            </BlockWrapper>
          </ErrorBoundary>
        );
      })}
    </div>
  );
};

export default BlockRenderer;
