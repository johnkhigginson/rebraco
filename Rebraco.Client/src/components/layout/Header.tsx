import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useSite } from '../../contexts/SiteContext';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export default function Header() {
  const { siteName, navigation, design } = useSite();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, loading: authLoading } = useCurrentUser();

  const variant = navigation?.headerVariant || 'standard';
  const sticky = navigation?.stickyHeader ?? true;
  const navLinks = navigation?.primaryNav || [];
  const ctaButton = navigation?.ctaButton ?? null;
  const logo = design?.logo || null;

  // Derive account link from auth state
  const accountLink = (() => {
    if (authLoading) return null;
    if (!user) return { label: 'Sign In', href: '/portal/login' };
    if (user.roles?.includes('Tenant')) return { label: 'My Account', href: '/portal' };
    if (user.roles?.includes('Prospect')) return null;
    // Authenticated but not Tenant/Prospect = Manager
    return { label: 'Dashboard', href: '/manage' };
  })();

  const isTransparent = variant === 'transparent';

  return (
    <header
      className={[
        'z-50 transition-colors duration-300',
        sticky ? 'sticky top-0' : '',
        isTransparent
          ? 'absolute top-0 left-0 right-0 bg-transparent text-header-text'
          : 'bg-header-bg text-header-text shadow-md',
      ].join(' ')}
    >
      <div className="max-w-7xl mx-auto px-6">
        {variant === 'centered' ? (
          <CenteredLayout
            siteName={siteName}
            logo={logo}
            navLinks={navLinks}
            ctaButton={ctaButton}
            accountLink={accountLink}
            location={location}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />
        ) : variant === 'minimal' ? (
          <MinimalLayout
            siteName={siteName}
            logo={logo}
            navLinks={navLinks}
            ctaButton={ctaButton}
            accountLink={accountLink}
            location={location}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />
        ) : (
          <StandardLayout
            siteName={siteName}
            logo={logo}
            navLinks={navLinks}
            ctaButton={ctaButton}
            accountLink={accountLink}
            location={location}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="lg:hidden bg-header-bg border-t border-white/10">
          <nav className="px-6 py-4 flex flex-col gap-2">
            {navLinks.map((link, i) => (
              <Link
                key={i}
                to={link.url}
                className={`py-3 px-4 rounded-lg transition ${
                  location.pathname === link.url
                    ? 'bg-white/10 text-header-nav-active'
                    : 'text-header-nav hover:bg-white/5 hover:text-header-nav-hover'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {accountLink && (
              <Link
                to={accountLink.href}
                className="py-3 px-4 rounded-lg transition text-header-nav hover:bg-white/5 hover:text-header-nav-hover flex items-center gap-2"
                onClick={() => setMobileOpen(false)}
              >
                <UserIcon />
                {accountLink.label}
              </Link>
            )}
            {ctaButton && (
              <Link
                to={ctaButton.url}
                className="py-3 px-4 bg-primary text-white rounded-lg text-center font-semibold mt-2"
                onClick={() => setMobileOpen(false)}
              >
                {ctaButton.name}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

// --- Layout Variants ---

interface LayoutProps {
  siteName: string;
  logo: string | null;
  navLinks: Array<{ url: string; name: string }>;
  ctaButton: { url: string; name: string } | null;
  accountLink: { label: string; href: string } | null;
  location: { pathname: string };
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

function Logo({ siteName, logo }: { siteName: string; logo: string | null }) {
  return (
    <Link to="/" className="flex items-center gap-3">
      {logo ? (
        <img src={logo} alt={siteName} className="h-8" />
      ) : (
        <span className="text-2xl font-bold">{siteName}</span>
      )}
    </Link>
  );
}

function NavLinks({ navLinks, location }: { navLinks: LayoutProps['navLinks']; location: LayoutProps['location'] }) {
  return (
    <nav className="hidden lg:flex items-center gap-1">
      {navLinks.map((link, i) => (
        <Link
          key={i}
          to={link.url}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            location.pathname === link.url
              ? 'bg-white/10 text-header-nav-active'
              : 'text-header-nav hover:text-header-nav-hover hover:bg-white/5'
          }`}
        >
          {link.name}
        </Link>
      ))}
    </nav>
  );
}

function UserIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function AccountButton({ accountLink }: { accountLink: LayoutProps['accountLink'] }) {
  if (!accountLink) return null;
  return (
    <Link
      to={accountLink.href}
      className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-header-nav hover:text-header-nav-hover transition rounded-lg hover:bg-white/5"
    >
      <UserIcon />
      {accountLink.label}
    </Link>
  );
}

function HamburgerButton({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (v: boolean) => void }) {
  return (
    <button
      className="lg:hidden p-2 text-header-nav hover:text-header-nav-hover"
      onClick={() => setMobileOpen(!mobileOpen)}
      aria-label="Toggle menu"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {mobileOpen ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        )}
      </svg>
    </button>
  );
}

function StandardLayout({ siteName, logo, navLinks, ctaButton, accountLink, location, mobileOpen, setMobileOpen }: LayoutProps) {
  return (
    <div className="flex items-center justify-between h-16">
      <Logo siteName={siteName} logo={logo} />
      <div className="flex items-center gap-4">
        <NavLinks navLinks={navLinks} location={location} />
        <AccountButton accountLink={accountLink} />
        {ctaButton && (
          <Link
            to={ctaButton.url}
            className="hidden lg:inline-flex px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition"
          >
            {ctaButton.name}
          </Link>
        )}
        <HamburgerButton mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      </div>
    </div>
  );
}

function CenteredLayout({ siteName, logo, navLinks, ctaButton, accountLink, location, mobileOpen, setMobileOpen }: LayoutProps) {
  return (
    <div className="flex flex-col items-center py-4 gap-3">
      <Logo siteName={siteName} logo={logo} />
      <div className="flex items-center gap-4">
        <NavLinks navLinks={navLinks} location={location} />
        <AccountButton accountLink={accountLink} />
        {ctaButton && (
          <Link
            to={ctaButton.url}
            className="hidden lg:inline-flex px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition"
          >
            {ctaButton.name}
          </Link>
        )}
        <HamburgerButton mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      </div>
    </div>
  );
}

function MinimalLayout({ siteName, logo, accountLink, mobileOpen, setMobileOpen }: LayoutProps) {
  return (
    <div className="flex items-center justify-between h-16">
      <Logo siteName={siteName} logo={logo} />
      <div className="flex items-center gap-4">
        <AccountButton accountLink={accountLink} />
        <HamburgerButton mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      </div>
    </div>
  );
}
