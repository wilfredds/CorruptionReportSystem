'use client';

import { useTranslations, useLocale } from 'next-intl';
import { formatPeso, type JobTotals } from '@/lib/calc';
import { intlTagFor } from '@/i18n/locales';
import { cn } from '@/lib/utils';

/**
 * The running total, pinned to the bottom of every wizard step.
 *
 * It is a read-only display — there is no input here and no way to type a
 * total. The figure comes straight from `computeJobTotals`, the same function
 * the server uses when it saves.
 */
export function TotalBar({ totals, className }: { totals: JobTotals; className?: string }) {
  const t = useTranslations('wizard');
  const tj = useTranslations('job');
  const tag = intlTagFor(useLocale());

  return (
    <div className={cn('total-bar -mx-4 mt-8 px-4 py-4 sm:mx-0 sm:rounded-t-xl', className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="text-lg font-semibold text-muted-foreground">{t('grandTotal')}</p>
          {/* Read-only by construction: rendered text, never an input. */}
          <output
            aria-live="polite"
            aria-atomic="true"
            className="grand-total block text-primary"
          >
            {formatPeso(totals.total, tag)}
          </output>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-base">
          <div className="flex gap-2">
            <dt className="text-muted-foreground">{tj('subtotal')}:</dt>
            <dd className="font-semibold tabular-nums">{formatPeso(totals.subtotal, tag)}</dd>
          </div>
          {totals.discount > 0 ? (
            <div className="flex gap-2">
              <dt className="text-muted-foreground">{tj('discount')}:</dt>
              <dd className="font-semibold tabular-nums text-destructive">
                −{formatPeso(totals.discount, tag)}
              </dd>
            </div>
          ) : null}
          {totals.amountPaid > 0 ? (
            <div className="flex gap-2">
              <dt className="text-muted-foreground">{tj('balance')}:</dt>
              <dd
                className={cn(
                  'font-semibold tabular-nums',
                  totals.balance > 0 ? 'text-destructive' : 'text-success',
                )}
              >
                {formatPeso(totals.balance, tag)}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}
