'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Home,
  ClipboardList,
  Users,
  Car,
  Wrench,
  BarChart3,
  ShieldCheck,
  Settings,
  History,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/lib/rbac';

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  clipboard: ClipboardList,
  users: Users,
  car: Car,
  wrench: Wrench,
  chart: BarChart3,
  shield: ShieldCheck,
  settings: Settings,
  history: History,
};

/**
 * Navigation entries: a large icon with a text label beside it, always.
 * Each row is 64px tall so it is comfortable to tap.
 */
export function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <nav className="flex flex-col gap-2" aria-label={t('menu')}>
      {items.map((item) => {
        const Icon = ICONS[item.icon] ?? Home;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-tap items-center gap-4 rounded-lg px-4 py-3 text-lg font-semibold',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="size-7 shrink-0" aria-hidden />
            <span>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
