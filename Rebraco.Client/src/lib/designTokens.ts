/**
 * Design Tokens System
 *
 * Maps CMS "design" document type properties → CSS custom properties on :root.
 * Comprehensive ~97-token design system covering typography, colors, spacing,
 * buttons, forms, component tokens, borders/effects, animations, header/footer
 * theming, and custom code.
 */

import { resolveMediaUrl } from './utils';

// --- Types ---

export interface TypographyRule {
  selector: string;
  fontFamily?: string;
  fontSize?: string;
  fontSizeMobile?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: string;
  color?: string;
  marginTop?: string;
  marginBottom?: string;
}

export interface ButtonStyleItem {
  styleName: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  hoverBgColor?: string;
  hoverTextColor?: string;
  hoverBorderColor?: string;
  borderWidth?: string;
}

export interface ColorScheme {
  schemeName: string;
  schemeSlug: string;
  bgColor: string;
  textColor: string;
  headingColor: string;
  linkColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  accentColor: string;
  surfaceColor: string;
  borderColor: string;
  mutedTextColor: string;
  // Expanded
  dividerColor: string;
  inputBorderColor: string;
  inputBgColor: string;
}

export interface DesignData {
  // Branding
  logo: string | null;
  favicon: string | null;
  // Color Schemes
  colorSchemes: ColorScheme[];
  // Typography
  headingFont: string;
  bodyFont: string;
  displayFont: string;
  monoFont: string;
  baseFontSize: string;
  typographyRules: TypographyRule[];
  headingLetterSpacing: string;
  headingTextTransform: string;
  bodyLineHeight: string;
  blockquoteFontStyle: string;
  blockquoteBorderColor: string;
  leadFontSize: string;
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  textMutedColor: string;
  headingColor: string;
  linkColor: string;
  linkHoverColor: string;
  backgroundColor: string;
  surfaceColor: string;
  borderColor: string;
  linkVisitedColor: string;
  overlayColor: string;
  dividerColor: string;
  shadowColor: string;
  selectionBgColor: string;
  selectionTextColor: string;
  // Header & Footer
  headerBgColor: string;
  headerTextColor: string;
  headerNavColor: string;
  headerNavHoverColor: string;
  headerNavActiveColor: string;
  footerBgColor: string;
  footerTextColor: string;
  footerHeadingColor: string;
  footerLinkColor: string;
  footerLinkHoverColor: string;
  footerBorderColor: string;
  // Buttons
  buttonRadius: string;
  buttonSize: string;
  buttonFontWeight: string;
  buttonTextTransform: string;
  buttonStyles: ButtonStyleItem[];
  // Forms & Inputs
  inputBgColor: string;
  inputBorderColor: string;
  inputTextColor: string;
  inputPlaceholderColor: string;
  inputFocusBorderColor: string;
  inputErrorBorderColor: string;
  inputBorderRadius: string;
  inputBorderWidth: string;
  inputPaddingX: string;
  inputPaddingY: string;
  labelFontSize: string;
  labelFontWeight: string;
  labelColor: string;
  formFieldGap: string;
  checkboxAccentColor: string;
  // Spacing & Layout
  maxContentWidth: string;
  siteGutter: string;
  sectionSpacingSmall: string;
  sectionSpacingMedium: string;
  sectionSpacingLarge: string;
  sectionSpacingXl: string;
  cardPadding: string;
  cardGap: string;
  cardBorderRadius: string;
  cardShadow: string;
  cardHoverShadow: string;
  cardBorderWidth: string;
  // Component Tokens
  badgeRadius: string;
  badgePadding: string;
  badgeFontSize: string;
  tableHeaderBg: string;
  tableBorderColor: string;
  tableStripeBg: string;
  tableHoverBg: string;
  modalBg: string;
  modalRadius: string;
  modalShadow: string;
  tooltipBg: string;
  tooltipTextColor: string;
  tooltipRadius: string;
  alertRadius: string;
  alertBorderWidth: string;
  // Borders & Effects
  defaultBorderRadius: string;
  defaultShadow: string;
  hoverShadow: string;
  defaultBorderWidth: string;
  focusRingColor: string;
  focusRingWidth: string;
  // Animations
  animationSpeed: string;
  hoverEffect: string;
  enableScrollAnimations: boolean;
  reducedMotion: boolean;
  // Custom Code
  customCss: string;
  customHeadHtml: string;
  customBodyEndHtml: string;
}

// --- Lookup Maps ---

const BORDER_RADIUS_MAP: Record<string, string> = {
  none: '0px',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
};

const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
};

const ANIMATION_SPEED_MAP: Record<string, string> = {
  none: '0ms',
  slow: '500ms',
  normal: '300ms',
  fast: '150ms',
};

const BUTTON_RADIUS_MAP: Record<string, string> = {
  none: '0px',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  full: '9999px',
};

const BUTTON_SIZE_MAP: Record<string, { px: string; py: string; fontSize: string }> = {
  sm: { px: '1rem', py: '0.5rem', fontSize: '0.875rem' },
  md: { px: '1.5rem', py: '0.75rem', fontSize: '1rem' },
  lg: { px: '2rem', py: '1rem', fontSize: '1.125rem' },
};

const LINE_HEIGHT_MAP: Record<string, string> = {
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
};

const LETTER_SPACING_MAP: Record<string, string> = {
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
};

// --- Parse from Delivery API response ---

function extractColor(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val?.value || val?.color || '';
}

function extractDropdownValue(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val[0] || '';
  return '';
}

export function parseDesign(props: Record<string, any>, mediaBaseUrl?: string): DesignData {
  // Parse typography rules Block List
  const typoItems = props.typographyRules?.items || [];
  const typographyRules: TypographyRule[] = typoItems.map((item: any) => {
    const p = item.content?.properties || {};
    return {
      selector: p.selector || '',
      fontFamily: p.fontFamily || '',
      fontSize: p.fontSize || '',
      fontSizeMobile: p.fontSizeMobile || '',
      fontWeight: extractDropdownValue(p.fontWeight),
      lineHeight: extractDropdownValue(p.lineHeight),
      letterSpacing: extractDropdownValue(p.letterSpacing),
      textTransform: extractDropdownValue(p.textTransform),
      color: extractColor(p.color),
      marginTop: p.marginTop || '',
      marginBottom: p.marginBottom || '',
    };
  });

  // Parse button styles Block List
  const btnItems = props.buttonStyles?.items || [];
  const buttonStyles: ButtonStyleItem[] = btnItems.map((item: any) => {
    const p = item.content?.properties || {};
    return {
      styleName: p.styleName || '',
      bgColor: extractColor(p.bgColor),
      textColor: extractColor(p.textColor),
      borderColor: extractColor(p.borderColor),
      hoverBgColor: extractColor(p.hoverBgColor),
      hoverTextColor: extractColor(p.hoverTextColor),
      hoverBorderColor: extractColor(p.hoverBorderColor),
      borderWidth: extractDropdownValue(p.borderWidth),
    };
  });

  // Parse color schemes Block List
  const csItems = props.colorSchemes?.items || [];
  const colorSchemes: ColorScheme[] = csItems.map((item: any) => {
    const p = item.content?.properties || {};
    return {
      schemeName: p.schemeName || '',
      schemeSlug: p.schemeSlug || '',
      bgColor: extractColor(p.bgColor),
      textColor: extractColor(p.textColor),
      headingColor: extractColor(p.headingColor),
      linkColor: extractColor(p.linkColor),
      buttonBgColor: extractColor(p.buttonBgColor),
      buttonTextColor: extractColor(p.buttonTextColor),
      accentColor: extractColor(p.accentColor),
      surfaceColor: extractColor(p.surfaceColor),
      borderColor: extractColor(p.borderColor),
      mutedTextColor: extractColor(p.mutedTextColor),
      dividerColor: extractColor(p.dividerColor),
      inputBorderColor: extractColor(p.inputBorderColor),
      inputBgColor: extractColor(p.inputBgColor),
    };
  });

  return {
    // Branding
    logo: resolveMediaUrl(props.logo?.[0]?.url, mediaBaseUrl),
    favicon: resolveMediaUrl(props.favicon?.[0]?.url, mediaBaseUrl),
    // Color Schemes
    colorSchemes,
    // Typography
    headingFont: props.headingFont || '',
    bodyFont: props.bodyFont || '',
    displayFont: props.displayFont || '',
    monoFont: props.monoFont || '',
    baseFontSize: props.baseFontSize || '',
    typographyRules,
    headingLetterSpacing: extractDropdownValue(props.headingLetterSpacing),
    headingTextTransform: extractDropdownValue(props.headingTextTransform),
    bodyLineHeight: extractDropdownValue(props.bodyLineHeight),
    blockquoteFontStyle: extractDropdownValue(props.blockquoteFontStyle),
    blockquoteBorderColor: extractColor(props.blockquoteBorderColor),
    leadFontSize: props.leadFontSize || '',
    // Colors
    primaryColor: extractColor(props.primaryColor),
    secondaryColor: extractColor(props.secondaryColor),
    accentColor: extractColor(props.accentColor),
    textColor: extractColor(props.textColor),
    textMutedColor: extractColor(props.textMutedColor),
    headingColor: extractColor(props.headingColor),
    linkColor: extractColor(props.linkColor),
    linkHoverColor: extractColor(props.linkHoverColor),
    backgroundColor: extractColor(props.backgroundColor),
    surfaceColor: extractColor(props.surfaceColor),
    borderColor: extractColor(props.borderColor),
    linkVisitedColor: extractColor(props.linkVisitedColor),
    overlayColor: extractColor(props.overlayColor),
    dividerColor: extractColor(props.dividerColor),
    shadowColor: extractColor(props.shadowColor),
    selectionBgColor: extractColor(props.selectionBgColor),
    selectionTextColor: extractColor(props.selectionTextColor),
    // Header & Footer
    headerBgColor: extractColor(props.headerBgColor),
    headerTextColor: extractColor(props.headerTextColor),
    headerNavColor: extractColor(props.headerNavColor),
    headerNavHoverColor: extractColor(props.headerNavHoverColor),
    headerNavActiveColor: extractColor(props.headerNavActiveColor),
    footerBgColor: extractColor(props.footerBgColor),
    footerTextColor: extractColor(props.footerTextColor),
    footerHeadingColor: extractColor(props.footerHeadingColor),
    footerLinkColor: extractColor(props.footerLinkColor),
    footerLinkHoverColor: extractColor(props.footerLinkHoverColor),
    footerBorderColor: extractColor(props.footerBorderColor),
    // Buttons
    buttonRadius: extractDropdownValue(props.buttonRadius),
    buttonSize: extractDropdownValue(props.buttonSize),
    buttonFontWeight: extractDropdownValue(props.buttonFontWeight),
    buttonTextTransform: extractDropdownValue(props.buttonTextTransform),
    buttonStyles,
    // Forms & Inputs
    inputBgColor: extractColor(props.inputBgColor),
    inputBorderColor: extractColor(props.inputBorderColor),
    inputTextColor: extractColor(props.inputTextColor),
    inputPlaceholderColor: extractColor(props.inputPlaceholderColor),
    inputFocusBorderColor: extractColor(props.inputFocusBorderColor),
    inputErrorBorderColor: extractColor(props.inputErrorBorderColor),
    inputBorderRadius: extractDropdownValue(props.inputBorderRadius),
    inputBorderWidth: extractDropdownValue(props.inputBorderWidth),
    inputPaddingX: props.inputPaddingX || '',
    inputPaddingY: props.inputPaddingY || '',
    labelFontSize: props.labelFontSize || '',
    labelFontWeight: extractDropdownValue(props.labelFontWeight),
    labelColor: extractColor(props.labelColor),
    formFieldGap: props.formFieldGap || '',
    checkboxAccentColor: extractColor(props.checkboxAccentColor),
    // Spacing
    maxContentWidth: props.maxContentWidth || '',
    siteGutter: props.siteGutter || '',
    sectionSpacingSmall: props.sectionSpacingSmall || '',
    sectionSpacingMedium: props.sectionSpacingMedium || '',
    sectionSpacingLarge: props.sectionSpacingLarge || '',
    sectionSpacingXl: props.sectionSpacingXl || '',
    cardPadding: props.cardPadding || '',
    cardGap: props.cardGap || '',
    cardBorderRadius: extractDropdownValue(props.cardBorderRadius),
    cardShadow: extractDropdownValue(props.cardShadow),
    cardHoverShadow: extractDropdownValue(props.cardHoverShadow),
    cardBorderWidth: extractDropdownValue(props.cardBorderWidth),
    // Component Tokens
    badgeRadius: extractDropdownValue(props.badgeRadius),
    badgePadding: props.badgePadding || '',
    badgeFontSize: props.badgeFontSize || '',
    tableHeaderBg: extractColor(props.tableHeaderBg),
    tableBorderColor: extractColor(props.tableBorderColor),
    tableStripeBg: extractColor(props.tableStripeBg),
    tableHoverBg: extractColor(props.tableHoverBg),
    modalBg: extractColor(props.modalBg),
    modalRadius: extractDropdownValue(props.modalRadius),
    modalShadow: extractDropdownValue(props.modalShadow),
    tooltipBg: extractColor(props.tooltipBg),
    tooltipTextColor: extractColor(props.tooltipTextColor),
    tooltipRadius: extractDropdownValue(props.tooltipRadius),
    alertRadius: extractDropdownValue(props.alertRadius),
    alertBorderWidth: extractDropdownValue(props.alertBorderWidth),
    // Borders & Effects
    defaultBorderRadius: extractDropdownValue(props.defaultBorderRadius),
    defaultShadow: extractDropdownValue(props.defaultShadow),
    hoverShadow: extractDropdownValue(props.hoverShadow),
    defaultBorderWidth: extractDropdownValue(props.defaultBorderWidth),
    focusRingColor: extractColor(props.focusRingColor),
    focusRingWidth: props.focusRingWidth || '',
    // Animations
    animationSpeed: extractDropdownValue(props.animationSpeed),
    hoverEffect: extractDropdownValue(props.hoverEffect),
    enableScrollAnimations: props.enableScrollAnimations ?? false,
    reducedMotion: props.reducedMotion ?? true,
    // Custom Code
    customCss: props.customCss || '',
    customHeadHtml: props.customHeadHtml || '',
    customBodyEndHtml: props.customBodyEndHtml || '',
  };
}

// --- Pure CSS Generation (SSR-safe, no DOM) ---

/** Generate a CSS string of `:root` custom properties from design data. */
export function generateDesignCSS(design: DesignData): string {
  const vars: string[] = [];

  function addIf(prop: string, value: string) {
    if (value) vars.push(`  ${prop}: ${value};`);
  }

  // Colors
  addIf('--site-primary', design.primaryColor);
  addIf('--site-secondary', design.secondaryColor);
  addIf('--site-accent', design.accentColor);
  addIf('--site-text', design.textColor);
  addIf('--site-text-muted', design.textMutedColor);
  addIf('--site-heading', design.headingColor);
  addIf('--site-link', design.linkColor);
  addIf('--site-link-hover', design.linkHoverColor);
  addIf('--site-bg', design.backgroundColor);
  addIf('--site-surface', design.surfaceColor);
  addIf('--site-border', design.borderColor);
  addIf('--site-link-visited', design.linkVisitedColor);
  addIf('--site-overlay', design.overlayColor);
  addIf('--site-divider', design.dividerColor);
  addIf('--site-shadow', design.shadowColor);
  addIf('--site-selection-bg', design.selectionBgColor);
  addIf('--site-selection-text', design.selectionTextColor);

  // Header & Footer
  addIf('--header-bg', design.headerBgColor);
  addIf('--header-text', design.headerTextColor);
  addIf('--header-nav', design.headerNavColor);
  addIf('--header-nav-hover', design.headerNavHoverColor);
  addIf('--header-nav-active', design.headerNavActiveColor);
  addIf('--footer-bg', design.footerBgColor);
  addIf('--footer-text', design.footerTextColor);
  addIf('--footer-heading', design.footerHeadingColor);
  addIf('--footer-link', design.footerLinkColor);
  addIf('--footer-link-hover', design.footerLinkHoverColor);
  addIf('--footer-border', design.footerBorderColor);

  // Typography
  addIf('--site-heading-font', design.headingFont);
  addIf('--site-body-font', design.bodyFont);
  addIf('--site-display-font', design.displayFont);
  addIf('--site-mono-font', design.monoFont);
  addIf('--site-base-font-size', design.baseFontSize);
  const headingLs = LETTER_SPACING_MAP[design.headingLetterSpacing];
  if (headingLs) addIf('--site-heading-letter-spacing', headingLs);
  addIf('--site-heading-text-transform', design.headingTextTransform);
  const bodyLh = LINE_HEIGHT_MAP[design.bodyLineHeight];
  if (bodyLh) addIf('--site-body-line-height', bodyLh);
  addIf('--site-blockquote-style', design.blockquoteFontStyle);
  addIf('--site-blockquote-border', design.blockquoteBorderColor);
  addIf('--site-lead-font-size', design.leadFontSize);

  // Buttons
  const btnRadius = BUTTON_RADIUS_MAP[design.buttonRadius];
  if (btnRadius) addIf('--btn-radius', btnRadius);
  addIf('--btn-font-weight', design.buttonFontWeight);
  addIf('--btn-text-transform', design.buttonTextTransform);
  const btnSize = BUTTON_SIZE_MAP[design.buttonSize];
  if (btnSize) {
    vars.push(`  --btn-px: ${btnSize.px};`);
    vars.push(`  --btn-py: ${btnSize.py};`);
    vars.push(`  --btn-font-size: ${btnSize.fontSize};`);
  }
  for (const style of design.buttonStyles) {
    const slug = style.styleName.toLowerCase().replace(/\s+/g, '-');
    addIf(`--btn-${slug}-bg`, style.bgColor || '');
    addIf(`--btn-${slug}-text`, style.textColor || '');
    addIf(`--btn-${slug}-border`, style.borderColor || '');
    addIf(`--btn-${slug}-hover-bg`, style.hoverBgColor || '');
    addIf(`--btn-${slug}-hover-text`, style.hoverTextColor || '');
    addIf(`--btn-${slug}-hover-border`, style.hoverBorderColor || '');
    if (style.borderWidth) addIf(`--btn-${slug}-border-width`, `${style.borderWidth}px`);
  }

  // Forms & Inputs
  addIf('--input-bg', design.inputBgColor);
  addIf('--input-border', design.inputBorderColor);
  addIf('--input-text', design.inputTextColor);
  addIf('--input-placeholder', design.inputPlaceholderColor);
  addIf('--input-focus-border', design.inputFocusBorderColor);
  addIf('--input-error-border', design.inputErrorBorderColor);
  const inputRadius = BORDER_RADIUS_MAP[design.inputBorderRadius];
  if (inputRadius) addIf('--input-radius', inputRadius);
  if (design.inputBorderWidth) addIf('--input-border-width', `${design.inputBorderWidth}px`);
  addIf('--input-px', design.inputPaddingX);
  addIf('--input-py', design.inputPaddingY);
  addIf('--label-font-size', design.labelFontSize);
  addIf('--label-font-weight', design.labelFontWeight);
  addIf('--label-color', design.labelColor);
  addIf('--form-field-gap', design.formFieldGap);
  addIf('--checkbox-accent', design.checkboxAccentColor);

  // Spacing
  addIf('--max-content-width', design.maxContentWidth);
  addIf('--site-gutter', design.siteGutter);
  addIf('--spacing-sm', design.sectionSpacingSmall);
  addIf('--spacing-md', design.sectionSpacingMedium);
  addIf('--spacing-lg', design.sectionSpacingLarge);
  addIf('--spacing-xl', design.sectionSpacingXl);
  addIf('--card-padding', design.cardPadding);
  addIf('--card-gap', design.cardGap);
  const cardRadius = BORDER_RADIUS_MAP[design.cardBorderRadius];
  if (cardRadius) addIf('--card-radius', cardRadius);
  const cardShadow = SHADOW_MAP[design.cardShadow];
  if (cardShadow) addIf('--card-shadow', cardShadow);
  const cardHoverShadow = SHADOW_MAP[design.cardHoverShadow];
  if (cardHoverShadow) addIf('--card-hover-shadow', cardHoverShadow);
  if (design.cardBorderWidth) addIf('--card-border-width', `${design.cardBorderWidth}px`);

  // Component Tokens
  const badgeRad = BORDER_RADIUS_MAP[design.badgeRadius];
  if (badgeRad) addIf('--badge-radius', badgeRad);
  addIf('--badge-padding', design.badgePadding);
  addIf('--badge-font-size', design.badgeFontSize);
  addIf('--table-header-bg', design.tableHeaderBg);
  addIf('--table-border', design.tableBorderColor);
  addIf('--table-stripe-bg', design.tableStripeBg);
  addIf('--table-hover-bg', design.tableHoverBg);
  addIf('--modal-bg', design.modalBg);
  const modalRad = BORDER_RADIUS_MAP[design.modalRadius];
  if (modalRad) addIf('--modal-radius', modalRad);
  const modalShadow = SHADOW_MAP[design.modalShadow];
  if (modalShadow) addIf('--modal-shadow', modalShadow);
  addIf('--tooltip-bg', design.tooltipBg);
  addIf('--tooltip-text', design.tooltipTextColor);
  const tooltipRad = BORDER_RADIUS_MAP[design.tooltipRadius];
  if (tooltipRad) addIf('--tooltip-radius', tooltipRad);
  const alertRad = BORDER_RADIUS_MAP[design.alertRadius];
  if (alertRad) addIf('--alert-radius', alertRad);
  if (design.alertBorderWidth) addIf('--alert-border-width', `${design.alertBorderWidth}px`);

  // Borders & Effects
  const borderRadius = BORDER_RADIUS_MAP[design.defaultBorderRadius];
  if (borderRadius) addIf('--border-radius', borderRadius);
  const shadow = SHADOW_MAP[design.defaultShadow];
  if (shadow) addIf('--shadow', shadow);
  const hoverShadow = SHADOW_MAP[design.hoverShadow];
  if (hoverShadow) addIf('--hover-shadow', hoverShadow);
  if (design.defaultBorderWidth) addIf('--border-width', `${design.defaultBorderWidth}px`);
  addIf('--focus-ring-color', design.focusRingColor);
  addIf('--focus-ring-width', design.focusRingWidth);

  // Animations
  const speed = ANIMATION_SPEED_MAP[design.animationSpeed];
  if (speed) addIf('--transition-speed', speed);
  addIf('--hover-effect', design.hoverEffect);

  if (vars.length === 0) return '';

  let css = `:root {\n${vars.join('\n')}\n}`;
  if (design.baseFontSize) {
    css += `\nhtml { font-size: ${design.baseFontSize}; }`;
  }
  return css;
}

/** Generate typography CSS rules from design typography rules. */
export function generateTypographyCss(rules: TypographyRule[]): string {
  if (rules.length === 0) return '';

  const selectorMap: Record<string, string> = {
    h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', h6: 'h6',
    body: 'body', p: 'p', small: 'small', blockquote: 'blockquote',
    a: 'a', li: 'li', label: 'label',
  };

  let css = '';
  let mobileCss = '';

  for (const rule of rules) {
    const sel = selectorMap[rule.selector.toLowerCase()] || rule.selector;
    const props: string[] = [];

    if (rule.fontFamily) props.push(`font-family: '${rule.fontFamily}', sans-serif`);
    if (rule.fontSize) props.push(`font-size: ${rule.fontSize}`);
    if (rule.fontWeight) props.push(`font-weight: ${rule.fontWeight}`);
    if (rule.color) props.push(`color: ${rule.color}`);
    if (rule.textTransform && rule.textTransform !== 'none') props.push(`text-transform: ${rule.textTransform}`);

    const lh = LINE_HEIGHT_MAP[rule.lineHeight || ''];
    if (lh) props.push(`line-height: ${lh}`);

    const ls = LETTER_SPACING_MAP[rule.letterSpacing || ''];
    if (ls) props.push(`letter-spacing: ${ls}`);

    if (rule.marginTop) props.push(`margin-top: ${rule.marginTop}`);
    if (rule.marginBottom) props.push(`margin-bottom: ${rule.marginBottom}`);

    if (props.length > 0) {
      css += `${sel} { ${props.join('; ')}; }\n`;
    }

    if (rule.fontSizeMobile) {
      mobileCss += `${sel} { font-size: ${rule.fontSizeMobile}; }\n`;
    }
  }

  if (mobileCss) {
    css += `@media (max-width: 768px) {\n${mobileCss}}\n`;
  }

  return css;
}

/** Build a Google Fonts URL from design font settings. Returns null if no fonts. */
export function buildGoogleFontsUrl(design: DesignData): string | null {
  const fonts = new Set<string>();
  if (design.headingFont) fonts.add(design.headingFont);
  if (design.bodyFont) fonts.add(design.bodyFont);
  if (design.displayFont) fonts.add(design.displayFont);
  if (design.monoFont) fonts.add(design.monoFont);

  for (const rule of design.typographyRules) {
    if (rule.fontFamily) fonts.add(rule.fontFamily);
  }

  if (fonts.size === 0) return null;

  const families = Array.from(fonts)
    .sort() // deterministic ordering for SSR hydration
    .map(f => `family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800`)
    .join('&');

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

// --- Apply CSS Custom Properties (DOM — client only) ---

function setIf(root: HTMLElement, prop: string, value: string) {
  if (value) root.style.setProperty(prop, value);
}

export function applyDesignTokens(design: DesignData) {
  const root = document.documentElement;

  // --- Colors ---
  setIf(root, '--site-primary', design.primaryColor);
  setIf(root, '--site-secondary', design.secondaryColor);
  setIf(root, '--site-accent', design.accentColor);
  setIf(root, '--site-text', design.textColor);
  setIf(root, '--site-text-muted', design.textMutedColor);
  setIf(root, '--site-heading', design.headingColor);
  setIf(root, '--site-link', design.linkColor);
  setIf(root, '--site-link-hover', design.linkHoverColor);
  setIf(root, '--site-bg', design.backgroundColor);
  setIf(root, '--site-surface', design.surfaceColor);
  setIf(root, '--site-border', design.borderColor);
  setIf(root, '--site-link-visited', design.linkVisitedColor);
  setIf(root, '--site-overlay', design.overlayColor);
  setIf(root, '--site-divider', design.dividerColor);
  setIf(root, '--site-shadow', design.shadowColor);
  setIf(root, '--site-selection-bg', design.selectionBgColor);
  setIf(root, '--site-selection-text', design.selectionTextColor);

  // --- Header & Footer ---
  setIf(root, '--header-bg', design.headerBgColor);
  setIf(root, '--header-text', design.headerTextColor);
  setIf(root, '--header-nav', design.headerNavColor);
  setIf(root, '--header-nav-hover', design.headerNavHoverColor);
  setIf(root, '--header-nav-active', design.headerNavActiveColor);
  setIf(root, '--footer-bg', design.footerBgColor);
  setIf(root, '--footer-text', design.footerTextColor);
  setIf(root, '--footer-heading', design.footerHeadingColor);
  setIf(root, '--footer-link', design.footerLinkColor);
  setIf(root, '--footer-link-hover', design.footerLinkHoverColor);
  setIf(root, '--footer-border', design.footerBorderColor);

  // --- Typography ---
  setIf(root, '--site-heading-font', design.headingFont);
  setIf(root, '--site-body-font', design.bodyFont);
  setIf(root, '--site-display-font', design.displayFont);
  setIf(root, '--site-mono-font', design.monoFont);
  setIf(root, '--site-base-font-size', design.baseFontSize);
  const headingLs = LETTER_SPACING_MAP[design.headingLetterSpacing];
  if (headingLs) setIf(root, '--site-heading-letter-spacing', headingLs);
  setIf(root, '--site-heading-text-transform', design.headingTextTransform);
  const bodyLh = LINE_HEIGHT_MAP[design.bodyLineHeight];
  if (bodyLh) setIf(root, '--site-body-line-height', bodyLh);
  setIf(root, '--site-blockquote-style', design.blockquoteFontStyle);
  setIf(root, '--site-blockquote-border', design.blockquoteBorderColor);
  setIf(root, '--site-lead-font-size', design.leadFontSize);

  if (design.baseFontSize) {
    root.style.fontSize = design.baseFontSize;
  }

  // --- Buttons ---
  const btnRadius = BUTTON_RADIUS_MAP[design.buttonRadius];
  if (btnRadius) setIf(root, '--btn-radius', btnRadius);
  setIf(root, '--btn-font-weight', design.buttonFontWeight);
  setIf(root, '--btn-text-transform', design.buttonTextTransform);

  const btnSize = BUTTON_SIZE_MAP[design.buttonSize];
  if (btnSize) {
    root.style.setProperty('--btn-px', btnSize.px);
    root.style.setProperty('--btn-py', btnSize.py);
    root.style.setProperty('--btn-font-size', btnSize.fontSize);
  }

  // Per-style button tokens (primary, secondary, ghost, etc.)
  for (const style of design.buttonStyles) {
    const slug = style.styleName.toLowerCase().replace(/\s+/g, '-');
    setIf(root, `--btn-${slug}-bg`, style.bgColor || '');
    setIf(root, `--btn-${slug}-text`, style.textColor || '');
    setIf(root, `--btn-${slug}-border`, style.borderColor || '');
    setIf(root, `--btn-${slug}-hover-bg`, style.hoverBgColor || '');
    setIf(root, `--btn-${slug}-hover-text`, style.hoverTextColor || '');
    setIf(root, `--btn-${slug}-hover-border`, style.hoverBorderColor || '');
    setIf(root, `--btn-${slug}-border-width`, style.borderWidth ? `${style.borderWidth}px` : '');
  }

  // --- Forms & Inputs ---
  setIf(root, '--input-bg', design.inputBgColor);
  setIf(root, '--input-border', design.inputBorderColor);
  setIf(root, '--input-text', design.inputTextColor);
  setIf(root, '--input-placeholder', design.inputPlaceholderColor);
  setIf(root, '--input-focus-border', design.inputFocusBorderColor);
  setIf(root, '--input-error-border', design.inputErrorBorderColor);
  const inputRadius = BORDER_RADIUS_MAP[design.inputBorderRadius];
  if (inputRadius) setIf(root, '--input-radius', inputRadius);
  if (design.inputBorderWidth) setIf(root, '--input-border-width', `${design.inputBorderWidth}px`);
  setIf(root, '--input-px', design.inputPaddingX);
  setIf(root, '--input-py', design.inputPaddingY);
  setIf(root, '--label-font-size', design.labelFontSize);
  setIf(root, '--label-font-weight', design.labelFontWeight);
  setIf(root, '--label-color', design.labelColor);
  setIf(root, '--form-field-gap', design.formFieldGap);
  setIf(root, '--checkbox-accent', design.checkboxAccentColor);

  // --- Spacing ---
  setIf(root, '--max-content-width', design.maxContentWidth);
  setIf(root, '--site-gutter', design.siteGutter);
  setIf(root, '--spacing-sm', design.sectionSpacingSmall);
  setIf(root, '--spacing-md', design.sectionSpacingMedium);
  setIf(root, '--spacing-lg', design.sectionSpacingLarge);
  setIf(root, '--spacing-xl', design.sectionSpacingXl);
  setIf(root, '--card-padding', design.cardPadding);
  setIf(root, '--card-gap', design.cardGap);
  const cardRadius = BORDER_RADIUS_MAP[design.cardBorderRadius];
  if (cardRadius) setIf(root, '--card-radius', cardRadius);
  const cardShadow = SHADOW_MAP[design.cardShadow];
  if (cardShadow) setIf(root, '--card-shadow', cardShadow);
  const cardHoverShadow = SHADOW_MAP[design.cardHoverShadow];
  if (cardHoverShadow) setIf(root, '--card-hover-shadow', cardHoverShadow);
  if (design.cardBorderWidth) setIf(root, '--card-border-width', `${design.cardBorderWidth}px`);

  // --- Component Tokens ---
  const badgeRad = BORDER_RADIUS_MAP[design.badgeRadius];
  if (badgeRad) setIf(root, '--badge-radius', badgeRad);
  setIf(root, '--badge-padding', design.badgePadding);
  setIf(root, '--badge-font-size', design.badgeFontSize);
  setIf(root, '--table-header-bg', design.tableHeaderBg);
  setIf(root, '--table-border', design.tableBorderColor);
  setIf(root, '--table-stripe-bg', design.tableStripeBg);
  setIf(root, '--table-hover-bg', design.tableHoverBg);
  setIf(root, '--modal-bg', design.modalBg);
  const modalRad = BORDER_RADIUS_MAP[design.modalRadius];
  if (modalRad) setIf(root, '--modal-radius', modalRad);
  const modalShdw = SHADOW_MAP[design.modalShadow];
  if (modalShdw) setIf(root, '--modal-shadow', modalShdw);
  setIf(root, '--tooltip-bg', design.tooltipBg);
  setIf(root, '--tooltip-text', design.tooltipTextColor);
  const tooltipRad = BORDER_RADIUS_MAP[design.tooltipRadius];
  if (tooltipRad) setIf(root, '--tooltip-radius', tooltipRad);
  const alertRad = BORDER_RADIUS_MAP[design.alertRadius];
  if (alertRad) setIf(root, '--alert-radius', alertRad);
  if (design.alertBorderWidth) setIf(root, '--alert-border-width', `${design.alertBorderWidth}px`);

  // --- Borders & Effects ---
  const borderRadius = BORDER_RADIUS_MAP[design.defaultBorderRadius];
  if (borderRadius) setIf(root, '--border-radius', borderRadius);
  const shadow = SHADOW_MAP[design.defaultShadow];
  if (shadow) setIf(root, '--shadow', shadow);
  const hoverShadow = SHADOW_MAP[design.hoverShadow];
  if (hoverShadow) setIf(root, '--hover-shadow', hoverShadow);
  if (design.defaultBorderWidth) setIf(root, '--border-width', `${design.defaultBorderWidth}px`);
  setIf(root, '--focus-ring-color', design.focusRingColor);
  setIf(root, '--focus-ring-width', design.focusRingWidth);

  // --- Animations ---
  const speed = ANIMATION_SPEED_MAP[design.animationSpeed];
  if (speed) setIf(root, '--transition-speed', speed);
  setIf(root, '--hover-effect', design.hoverEffect);

  // Load Google Fonts dynamically
  loadGoogleFonts(design);

  // Generate typography style rules
  applyTypographyRules(design.typographyRules);
}

// --- Google Fonts Loading (DOM — client only) ---

function loadGoogleFonts(design: DesignData) {
  const url = buildGoogleFontsUrl(design);
  if (!url) return;

  const existing = document.getElementById('google-fonts-link');
  if (existing) existing.remove();

  const link = document.createElement('link');
  link.id = 'google-fonts-link';
  link.href = url;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

// --- Typography Rules → <style> (DOM — client only) ---

function applyTypographyRules(rules: TypographyRule[]) {
  const existing = document.getElementById('rebraco-typography-styles');
  if (existing) existing.remove();

  const css = generateTypographyCss(rules);
  if (css) {
    const style = document.createElement('style');
    style.id = 'rebraco-typography-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }
}

// --- Custom Code Injection ---

export function injectCustomCode(design: DesignData) {
  // Custom CSS
  if (design.customCss) {
    const existing = document.getElementById('rebraco-custom-css');
    if (existing) existing.remove();

    const style = document.createElement('style');
    style.id = 'rebraco-custom-css';
    style.textContent = design.customCss;
    document.head.appendChild(style);
  }

  // Custom Head HTML
  // TRUST BOUNDARY: This content is authored by CMS admins and intentionally allows scripts.
  // Do NOT sanitize with DOMPurify — it would strip the <script> tags that admins need to inject.
  if (design.customHeadHtml) {
    const existing = document.getElementById('rebraco-custom-head');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'rebraco-custom-head';
    container.innerHTML = design.customHeadHtml;
    // Move child nodes into <head>
    while (container.firstChild) {
      document.head.appendChild(container.firstChild);
    }
  }

  // Custom Body End HTML (same trust boundary as above)
  if (design.customBodyEndHtml) {
    const existing = document.getElementById('rebraco-custom-body-end');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'rebraco-custom-body-end';
    container.innerHTML = design.customBodyEndHtml;
    document.body.appendChild(container);
  }
}
