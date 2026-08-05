import { getTranslations, getLocale } from 'next-intl/server';
import { formatPeso } from '@/lib/calc';
import { intlTagFor } from '@/i18n/locales';
import { formatDate, formatDateTime } from '@/lib/utils';
import { describeVehicle, type SerializedJob } from '@/lib/jobs';
import type { ShopInfo } from '@/lib/settings';

/**
 * The on-screen receipt.
 *
 * The same layout is used for the browser-print fallback: `globals.css` hides
 * every bit of app chrome under `@media print` so Ctrl+P produces the same
 * document as the generated PDF.
 */
export async function ReceiptView({ job, shop }: { job: SerializedJob; shop: ShopInfo }) {
  const [t, tj, locale] = await Promise.all([
    getTranslations('receipt'),
    getTranslations('job'),
    getLocale(),
  ]);
  const tag = intlTagFor(locale);
  const peso = (v: number) => formatPeso(v, tag);

  return (
    <article className="receipt-sheet mx-auto max-w-3xl rounded-xl border-2 border-border bg-white p-8 text-black shadow-sm">
      <header className="border-b-4 border-black pb-4 text-center">
        <h1 className="text-2xl font-extrabold uppercase tracking-wide">{shop.name}</h1>
        <p className="mt-1 text-base leading-snug">{shop.address}</p>
        <p className="text-base">{shop.phone}</p>
        {shop.email ? <p className="text-base">{shop.email}</p> : null}
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <dl className="space-y-1">
          <div className="flex gap-2">
            <dt className="font-bold">{t('jobNumber')}</dt>
            <dd className="tabular-nums">{job.jobNumber}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-bold">{t('date')}</dt>
            <dd>{formatDate(job.date, tag)}</dd>
          </div>
        </dl>
        <dl className="space-y-1 sm:text-right">
          <div className="flex gap-2 sm:justify-end">
            <dt className="font-bold">{t('customer')}</dt>
            <dd>{job.customer.fullName}</dd>
          </div>
          <div className="flex gap-2 sm:justify-end">
            <dt className="font-bold">{t('vehicle')}</dt>
            <dd>{describeVehicle(job.vehicle)}</dd>
          </div>
          {job.customer.phone ? <dd className="text-base">{job.customer.phone}</dd> : null}
        </dl>
      </div>

      {job.services.length > 0 ? (
        <section className="mt-6">
          <h2 className="border-b-2 border-black pb-1 text-lg font-extrabold">
            {t('servicesDone')}
          </h2>
          <table className="w-full">
            <tbody>
              {job.services.map((service) => (
                <tr key={service.id} className="border-b border-black/20">
                  <td className="py-2 pr-4">{service.serviceName}</td>
                  <td className="py-2 text-right tabular-nums">{peso(service.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {job.parts.length > 0 ? (
        <section className="mt-6">
          <h2 className="border-b-2 border-black pb-1 text-lg font-extrabold">{t('spareParts')}</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/20 text-left text-base">
                <th className="py-1 pr-4 font-semibold">{t('item')}</th>
                <th className="py-1 pr-4 text-right font-semibold">{t('qty')}</th>
                <th className="py-1 pr-4 text-right font-semibold">{t('unitPrice')}</th>
                <th className="py-1 text-right font-semibold">{t('amount')}</th>
              </tr>
            </thead>
            <tbody>
              {job.parts.map((part) => (
                <tr key={part.id} className="border-b border-black/20">
                  <td className="py-2 pr-4">{part.partName}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{part.quantity}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{peso(part.unitPrice)}</td>
                  <td className="py-2 text-right tabular-nums">{peso(part.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <section className="mt-6 space-y-1.5">
        <Line label={t('labor')} value={peso(job.laborCharge)} />
        <Line label={t('expenses')} value={peso(job.expenses)} />
        <div className="border-t-2 border-black pt-1.5">
          <Line label={t('subtotal')} value={peso(job.subtotal)} bold />
        </div>
        {job.discount > 0 ? (
          <Line label={t('discount')} value={`− ${peso(job.discount)}`} />
        ) : null}

        <div className="mt-2 flex items-center justify-between border-y-4 border-black py-3">
          <span className="text-xl font-extrabold uppercase">{t('total')}</span>
          <span className="grand-total">{peso(job.total)}</span>
        </div>

        <div className="pt-2">
          <Line label={t('amountPaid')} value={peso(job.amountPaid)} bold />
          <Line label={t('balance')} value={peso(job.balance)} bold />
          {job.paymentMethod ? (
            <Line label={t('paymentMethod')} value={tj(`method_${job.paymentMethod}` as never)} />
          ) : null}
          <Line label={tj('status')} value={tj(`status_${job.status}` as never)} bold />
        </div>
      </section>

      {job.notes ? (
        <section className="mt-6 border-t-2 border-black/30 pt-3">
          <h2 className="text-base font-bold">{t('notes')}</h2>
          <p className="whitespace-pre-wrap text-base">{job.notes}</p>
        </section>
      ) : null}

      <footer className="mt-8 space-y-1 border-t-2 border-black pt-4 text-center">
        <p className="text-lg font-bold">{shop.footer || t('thankYou')}</p>
        {job.mechanic ? (
          <p className="text-base">
            {t('servedBy')}: {job.mechanic.name}
          </p>
        ) : job.createdBy ? (
          <p className="text-base">
            {t('servedBy')}: {job.createdBy.name}
          </p>
        ) : null}
        <p className="text-base">
          {t('printedOn')}: {formatDateTime(new Date(), tag)}
        </p>
      </footer>
    </article>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={bold ? 'font-bold' : ''}>{label}</span>
      <span className={`tabular-nums ${bold ? 'font-bold' : ''}`}>{value}</span>
    </div>
  );
}
