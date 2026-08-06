import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { PlusCircle } from 'lucide-react';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePageUser } from '@/lib/session';
import { formatPeso } from '@/lib/calc';
import { intlTagFor } from '@/i18n/locales';
import { decimalToNumber, formatDate, startOfDay, endOfDay } from '@/lib/utils';
import { notDeleted } from '@/lib/jobs';
import { jobFilterSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Badge, statusVariant } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/misc';
import { JobFilters } from './job-filters';

export const metadata = { title: 'Jobs — AutoCare' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePageUser();
  const raw = await searchParams;
  const [t, tj, tnav, locale] = await Promise.all([
    getTranslations('jobs'),
    getTranslations('job'),
    getTranslations('nav'),
    getLocale(),
  ]);
  const tag = intlTagFor(locale);

  const filters = jobFilterSchema.parse(raw);

  // Trashed jobs never appear in the list; they live on /trash.
  const where: Prisma.JobWhereInput = { ...notDeleted };

  if (filters.q) {
    where.OR = [
      { customer: { fullName: { contains: filters.q, mode: 'insensitive' } } },
      { vehicle: { plateNumber: { contains: filters.q, mode: 'insensitive' } } },
      { jobNumber: { contains: filters.q, mode: 'insensitive' } },
    ];
  }
  if (filters.status) where.status = filters.status;

  const fromDate = filters.from ? new Date(filters.from) : null;
  const toDate = filters.to ? new Date(filters.to) : null;
  if ((fromDate && !Number.isNaN(fromDate.getTime())) || (toDate && !Number.isNaN(toDate.getTime()))) {
    where.date = {};
    if (fromDate && !Number.isNaN(fromDate.getTime())) where.date.gte = startOfDay(fromDate);
    if (toDate && !Number.isNaN(toDate.getTime())) where.date.lte = endOfDay(toDate);
  }

  const [total, jobs] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        customer: { select: { fullName: true } },
        vehicle: { select: { plateNumber: true } },
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (page: number) => {
    const sp = new URLSearchParams();
    if (filters.q) sp.set('q', filters.q);
    if (filters.status) sp.set('status', filters.status);
    if (filters.from) sp.set('from', filters.from);
    if (filters.to) sp.set('to', filters.to);
    sp.set('page', String(page));
    return `/jobs?${sp.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1>{t('title')}</h1>
          <p className="mt-1 text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button asChild size="lg" variant="success">
          <Link href="/jobs/new">
            <PlusCircle aria-hidden />
            <span>{tnav('newJob')}</span>
          </Link>
        </Button>
      </div>

      <JobFilters />

      <p className="text-lg font-semibold text-muted-foreground">
        {t('resultCount', { count: total })}
      </p>

      {jobs.length === 0 ? (
        <EmptyState title={t('empty')} />
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/jobs/${job.id}`}
                className="flex min-h-tap flex-wrap items-center justify-between gap-4 lift rounded-lg border-2 border-border bg-background p-4 hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-bold">{job.customer.fullName}</span>
                  <span className="block truncate text-base text-muted-foreground">
                    {job.vehicle.plateNumber} · {job.jobNumber} · {formatDate(job.date, tag)}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-4">
                  <span className="money">{formatPeso(decimalToNumber(job.total), tag)}</span>
                  <Badge variant={statusVariant(job.status)}>
                    {tj(`status_${job.status}` as never)}
                  </Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 ? (
        <nav className="flex flex-wrap items-center justify-center gap-3" aria-label="Pages">
          {filters.page > 1 ? (
            <Button asChild variant="outline" size="compact">
              <Link href={pageHref(filters.page - 1)}>{'‹'}</Link>
            </Button>
          ) : null}
          <span className="text-lg font-semibold">
            {filters.page} / {pageCount}
          </span>
          {filters.page < pageCount ? (
            <Button asChild variant="outline" size="compact">
              <Link href={pageHref(filters.page + 1)}>{'›'}</Link>
            </Button>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
