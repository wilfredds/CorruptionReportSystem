'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './language-switcher';
import { NavLinks } from './nav-links';
import type { NavItem } from '@/lib/rbac';
import { signOutAction } from '@/app/actions/sign-out';

/**
 * The persistent top bar: shop name, language switch, and a Log out button that
 * is reachable from every single screen.
 */
export function TopBar({
  shopName,
  userName,
  navItems,
}: {
  shopName: string;
  userName: string;
  navItems: NavItem[];
}) {
  const t = useTranslations('common');
  const tn = useTranslations('nav');
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <header className="app-header sticky top-0 z-40 border-b-2 border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        {/* Mobile menu toggle — labelled, never a bare icon. */}
        <Button
          variant="outline"
          size="compact"
          className="lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
        >
          {menuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
          <span>{tn('menu')}</span>
        </Button>

        <Link
          href="/dashboard"
          className="min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
        >
          <span className="block truncate text-xl font-extrabold leading-tight">{shopName}</span>
          <span className="block truncate text-base text-muted-foreground">{userName}</span>
        </Link>

        <div className="hidden sm:block">
          <LanguageSwitcher signedIn />
        </div>

        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="compact">
            <LogOut aria-hidden />
            <span className="hidden sm:inline">{t('logout')}</span>
          </Button>
        </form>
      </div>

      {menuOpen ? (
        <div id="mobile-nav" className="border-t-2 border-border bg-muted/40 p-4 lg:hidden">
          <div className="mb-4 sm:hidden">
            <LanguageSwitcher signedIn />
          </div>
          <NavLinks items={navItems} onNavigate={() => setMenuOpen(false)} />
        </div>
      ) : null}
    </header>
  );
}
