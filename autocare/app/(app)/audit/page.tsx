import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePageAdmin } from '@/lib/session';
import { intlTagFor } from '@/i18n/locales';
import { formatDateTime } from '@/lib/utils';
import { AUDIT_ACTIONS } from '@/lib/audit';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';

export const metadata = { title: 'Activity Log — AutoCare' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

/** The audit trail. ADMIN only — the owner can see everything that happened. */
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  await requirePageAdmin();
  const params = await searchParams;
  const [t, tcom, locale] = await Promise.all([
    getTranslations('audit'),
    getTranslations('common'),
    getLocale(),
  ]);
  const tag = intlTagFor(locale);

  const action =
    params.action && (AUDIT_ACTIONS as readonly string[]).includes(params.action)
      ? params.action
      : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.AuditLogWhereInput = action ? { action } : {};

  const [total, entries] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, username: true } } },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /** Known actions get a translated label; anything else falls back to its code. */
  const describe = (value: string) => {
    const key = `action_${value}`;
    const label = t.has(key as never) ? t(key as never) : value;
    return label;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>{t('title')}</h1>
        <p className="mt-1 text-lg text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="rounded-xl border-2 border-border bg-muted/30 p-5">
        <p className="mb-3 text-lg font-semibold">{t('filterAction')}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant={action ? 'outline' : 'default'} size="compact">
            <Link href="/audit">{tcom('all')}</Link>
          </Button>
          {AUDIT_ACTIONS.map((value) => (
            <Button
              key={value}
              asChild
              variant={action === value ? 'default' : 'outline'}
              size="compact"
            >
              <Link href={`/audit?action=${value}`}>{describe(value)}</Link>
            </Button>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState title={t('empty')} />
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-lg border-2 border-border bg-background p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold">{describe(entry.action)}</p>
                <p className="text-base text-muted-foreground">
                  {t('who')}: {entry.user ? `${entry.user.name} (@${entry.user.username})` : '—'}
                </p>
                <p className="text-base text-muted-foreground">
                  {t('record')}: {entry.entity}
                  {entry.entityId ? ` · ${entry.entityId}` : ''}
                </p>
                {entry.metadata ? (
                  <p className="mt-1 break-all text-base text-muted-foreground">
                    {JSON.stringify(entry.metadata)}
                  </p>
                ) : null}
              </div>

              <div className="shrink-0 text-right">
                <p className="text-base font-semibold">{formatDateTime(entry.createdAt, tag)}</p>
                {entry.ipAddress ? (
                  <Badge variant="muted" className="mt-1">
                    {entry.ipAddress}
                  </Badge>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 ? (
        <nav className="flex items-center justify-center gap-3">
          {page > 1 ? (
            <Button asChild variant="outline" size="compact">
              <Link href={`/audit?${action ? `action=${action}&` : ''}page=${page - 1}`}>{'‹'}</Link>
            </Button>
          ) : null}
          <span className="text-lg font-semibold">
            {page} / {pageCount}
          </span>
          {page < pageCount ? (
            <Button asChild variant="outline" size="compact">
              <Link href={`/audit?${action ? `action=${action}&` : ''}page=${page + 1}`}>{'›'}</Link>
            </Button>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
