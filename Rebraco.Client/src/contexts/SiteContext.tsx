import { createContext, useContext, type ReactNode } from 'react';
import { type DesignData, type ColorScheme } from '../lib/designTokens';
import type { GeneralData } from '../lib/scripts';
import type { NavigationData, FooterData } from '../lib/siteData';

// Re-export for consumers
export type { ColorScheme, NavigationData, FooterData };

// --- Types ---

interface SiteContextValue {
  siteName: string;
  navigation: NavigationData | null;
  footer: FooterData | null;
  design: DesignData | null;
  general: GeneralData | null;
  loading: boolean;
  getColorScheme: (slug: string) => ColorScheme | undefined;
}

// --- Context ---

const SiteContext = createContext<SiteContextValue>({
  siteName: 'Rebraco',
  navigation: null,
  footer: null,
  design: null,
  general: null,
  loading: false,
  getColorScheme: () => undefined,
});

// --- Provider (populated from root loader data) ---

interface SiteProviderProps {
  data: {
    siteName: string;
    navigation: NavigationData | null;
    footer: FooterData | null;
    design: DesignData | null;
    general: GeneralData | null;
  };
  children: ReactNode;
}

export function SiteProvider({ data, children }: SiteProviderProps) {
  function getColorScheme(slug: string): ColorScheme | undefined {
    return data.design?.colorSchemes.find(s => s.schemeSlug === slug);
  }

  return (
    <SiteContext.Provider
      value={{
        siteName: data.siteName,
        navigation: data.navigation,
        footer: data.footer,
        design: data.design,
        general: data.general,
        loading: false,
        getColorScheme,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}
