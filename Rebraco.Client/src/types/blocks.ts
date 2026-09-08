/** Standardized props interface for all block components */
export interface BlockContentProps<T = Record<string, any>> {
  data: T;
}

/** Settings applied to every block via the BlockWrapper */
export interface ComponentSettings {
  anchorName?: string;
  cssClasses?: string;
  colorScheme?: string;
  hideComponent?: boolean;
  paddingTop?: string;
  paddingBottom?: string;
  containerWidth?: string;
}

/** Umbraco Rich Text property value */
export interface RichTextValue {
  markup: string;
  blocks?: any[];
}

/** Umbraco Media Picker item */
export interface MediaItem {
  url: string;
  name?: string;
  width?: number;
  height?: number;
  focalPoint?: { left: number; top: number };
  crops?: Array<{ alias: string; width: number; height: number }>;
}

/** Umbraco Multi URL Picker item */
export interface LinkItem {
  url: string;
  name: string;
  title?: string;
  target?: string;
  type?: string;
}

/** A single banner slide from the Delivery API (bannerItem nested element) */
export interface BannerItemData {
  // Content group
  image?: Array<{ url: string }>;
  heading?: string;
  headingLevel?: string;
  secondaryHeading?: string;
  secondaryHeadingSize?: 'S' | 'M' | 'L';
  text?: RichTextValue;
  buttons?: LinkItem[];
  // Design & Layout group (flattened in Delivery API)
  colorScheme?: string;
  bannerStyle?: 'takeover' | 'medium' | 'short' | 'scale';
  textAlignment?: 'left' | 'center' | 'right';
  textPosition?: string;
  addColorOverlay?: boolean;
  // Advanced group
  componentName?: string;
  cssClasses?: string;
  hideFromWebsite?: boolean;
}

/** Banner settings from the Block Grid settings (bannerSettings element type) */
export interface BannerSettingsData extends ComponentSettings {
  componentName?: string;
  enableRandomOrder?: boolean;
  showArrows?: boolean;
  autoRotateSpeed?: number;
  sticky?: boolean;
}
