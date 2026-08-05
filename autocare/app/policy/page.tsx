import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { getShopInfo } from '@/lib/settings';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { intlTagFor } from '@/i18n/locales';
import { LanguageSwitcher } from '@/components/app-shell/language-switcher';
import { Button } from '@/components/ui/button';
import { PolicyAcknowledgement } from './acknowledgement';

export const metadata = { title: 'Rules of Use — AutoCare' };

/**
 * The Acceptable Use Policy.
 *
 * Reachable by anyone from the footer, and shown as a gate on a user's very
 * first login (middleware redirects here until `policyAcceptedAt` is set).
 */
export default async function PolicyPage({
  searchParams,
}: {
  searchParams: Promise<{ first?: string }>;
}) {
  const params = await searchParams;
  const [shop, t, user] = await Promise.all([
    getShopInfo(),
    getTranslations('policy'),
    getSessionUser(),
  ]);

  const acceptedAt = user
    ? (
        await prisma.user.findUnique({
          where: { id: user.id },
          select: { policyAcceptedAt: true },
        })
      )?.policyAcceptedAt
    : null;

  const mustAcknowledge = Boolean(user) && !acceptedAt;
  const showGate = mustAcknowledge || params.first === '1';

  const rules = [1, 2, 3, 4, 5] as const;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex items-center justify-between gap-4 border-b-2 border-border bg-background p-4">
        <span className="truncate text-xl font-extrabold">{shop.name}</span>
        <LanguageSwitcher signedIn={Boolean(user)} />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="space-y-8 rounded-xl border-2 border-border bg-background p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-9" aria-hidden />
            </span>
            <div className="space-y-2">
              <h1>{t('title')}</h1>
              <p className="text-lg text-muted-foreground">{t('subtitle')}</p>
            </div>
          </div>

          <p className="text-lg">{t('intro', { shopName: shop.name })}</p>

          <ol className="space-y-6">
            {rules.map((n) => (
              <li key={n} className="rounded-lg border-2 border-border bg-muted/30 p-5">
                <h2 className="flex items-start gap-3 text-xl font-bold">
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-lg text-primary-foreground"
                  >
                    {n}
                  </span>
                  <span>{t(`rule${n}Title` as never)}</span>
                </h2>
                <p className="mt-3 text-lg leading-relaxed">{t(`rule${n}Body` as never)}</p>
              </li>
            ))}
          </ol>

          {showGate && user ? (
            <PolicyAcknowledgement alreadyAccepted={Boolean(acceptedAt)} />
          ) : (
            <div className="space-y-4">
              {acceptedAt ? (
                <p className="rounded-lg border-2 border-success/40 bg-success/10 p-4 text-lg font-semibold text-success">
                  {t('acceptedOn', {
                    date: formatDate(acceptedAt, intlTagFor(user?.locale ?? 'fil')),
                  })}
                </p>
              ) : null}
              <Button asChild variant="outline" size="lg">
                <Link href={user ? '/dashboard' : '/login'}>
                  <ArrowLeft aria-hidden />
                  <span>{user ? 'Dashboard' : 'Login'}</span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
