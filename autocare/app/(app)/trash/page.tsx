import { getTranslations, getLocale } from 'next-intl/server';
import { Trash2, Undo2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requirePageAdmin } from '@/lib/session';
import { formatPeso } from '@/lib/calc';
import { intlTagFor } from '@/i18n/locales';
import { onlyDeleted } from '@/lib/jobs';
import { decimalToNumber, formatDate, formatDateTime } from '@/lib/utils';
import { Badge, statusVariant } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/misc';
import { TrashRowActions } from './trash-controls';

export const metadata = { title: 'Trash — AutoCare' };
export const dynamic = 'force-dynamic';

/**
 * The Trash: jobs that were deleted but not destroyed.
 *
 * This exists because the person recording jobs every day is not comfortable
 * with computers, and "Burahin" on the wrong row should be a moment's
 * annoyance rather than a lost record. ADMIN only — restoring or purging is an
 * owner decision.
 */
export default async function TrashPage() {
  await requirePageAdmin();

  const [t, tj, locale] = await Promise.all([
    getTranslations('trash'),
    getTranslations('job'),
    getLocale(),
  ]);
  const tag = intlTagFor(locale);

  const jobs = await prisma.job.findMany({
    where: onlyDeleted,
    orderBy: { deletedAt: 'desc' },
    take: 200,
    include: {
      customer: { select: { fullName: true } },
      vehicle: { select: { plateNumber: true } },
      deletedBy: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1>{t('title')}</h1>
        <p className="mt-1 text-lg text-muted-foreground">{t('subtitle')}</p>
      </div>

      <p className="rounded-xl border-2 border-border bg-muted/40 p-4 text-lg text-muted-foreground">
        {t('explainer')}
      </p>

      {jobs.length === 0 ? (
        <EmptyState title={t('empty')} icon={<Trash2 className="size-12" aria-hidden />} />
      ) : (
        <ul className="space-y-3">
          {jobs.map((job, index) => (
            <li
              key={job.id}
              className="animate-rise space-y-4 rounded-xl border-2 border-border bg-background p-5"
              style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold">{job.customer.fullName}</p>
                  <p className="truncate text-base text-muted-foreground">
                    {job.vehicle.plateNumber} · {job.jobNumber} · {formatDate(job.date, tag)}
                  </p>
                  <p className="mt-1 text-base text-muted-foreground">
                    {t('deletedBy', {
                      who: job.deletedBy?.name ?? '—',
                      when: job.deletedAt ? formatDateTime(job.deletedAt, tag) : '—',
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="money">{formatPeso(decimalToNumber(job.total), tag)}</span>
                  <Badge variant={statusVariant(job.status)}>
                    {tj(`status_${job.status}` as never)}
                  </Badge>
                </div>
              </div>

              <TrashRowActions
                jobId={job.id}
                jobNumber={job.jobNumber}
                customerName={job.customer.fullName}
              />
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-center gap-2 text-base text-muted-foreground">
        <Undo2 className="size-5" aria-hidden />
        {t('restoreHint')}
      </p>
    </div>
  );
}
