import { getTranslations, getLocale } from 'next-intl/server';
import { Download } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requirePageAdmin } from '@/lib/session';
import { formatPeso } from '@/lib/calc';
import { intlTagFor } from '@/i18n/locales';
import { decimalToNumber, formatDate, startOfDay, endOfDay } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, StatCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/misc';
import { MonthlyIncomeChart } from '../dashboard/monthly-chart';
import { ReportRangePicker } from './range-picker';

export const metadata = { title: 'Reports — AutoCare' };
export const dynamic = 'force-dynamic';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  // ADMIN only, re-checked on the server — not just in the middleware.
  await requirePageAdmin();

  const params = await searchParams;
  const [t, locale] = await Promise.all([getTranslations('reports'), getLocale()]);
  const tag = intlTagFor(locale);

  const now = new Date();
  const parsedFrom = params.from ? new Date(params.from) : null;
  const parsedTo = params.to ? new Date(params.to) : null;

  const from =
    parsedFrom && !Number.isNaN(parsedFrom.getTime())
      ? startOfDay(parsedFrom)
      : startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  const to =
    parsedTo && !Number.isNaN(parsedTo.getTime()) ? endOfDay(parsedTo) : endOfDay(now);

  const jobs = await prisma.job.findMany({
    where: { date: { gte: from, lte: to } },
    include: {
      customer: { select: { id: true, fullName: true } },
      parts: { select: { partName: true, quantity: true, lineTotal: true } },
    },
    orderBy: { date: 'asc' },
  });

  const totalIncome = jobs.reduce((s, j) => s + decimalToNumber(j.amountPaid), 0);
  const totalBilled = jobs.reduce((s, j) => s + decimalToNumber(j.total), 0);
  const outstanding = jobs.reduce((s, j) => s + decimalToNumber(j.balance), 0);

  // ---- daily income ------------------------------------------------------
  const daily = new Map<string, number>();
  for (const job of jobs) {
    const key = job.date.toISOString().slice(0, 10);
    daily.set(key, (daily.get(key) ?? 0) + decimalToNumber(job.amountPaid));
  }
  const dailyRows = Array.from(daily.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  // ---- monthly income ----------------------------------------------------
  const monthly = new Map<string, number>();
  for (const job of jobs) {
    const key = `${job.date.getFullYear()}-${String(job.date.getMonth() + 1).padStart(2, '0')}`;
    monthly.set(key, (monthly.get(key) ?? 0) + decimalToNumber(job.amountPaid));
  }
  const monthlyRows = Array.from(monthly.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        label: new Intl.DateTimeFormat(tag, { month: 'short', year: '2-digit' }).format(
          new Date(year, month - 1, 1),
        ),
        value,
      };
    });

  // ---- most-used spare parts --------------------------------------------
  const partTotals = new Map<string, { quantity: number; times: number; amount: number }>();
  for (const job of jobs) {
    for (const part of job.parts) {
      const key = part.partName.trim().toLowerCase();
      const entry = partTotals.get(key) ?? { quantity: 0, times: 0, amount: 0 };
      entry.quantity += part.quantity;
      entry.times += 1;
      entry.amount += decimalToNumber(part.lineTotal);
      partTotals.set(key, entry);
    }
  }
  const topParts = Array.from(partTotals.entries())
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 10);

  // ---- top customers by revenue -----------------------------------------
  const customerTotals = new Map<string, { name: string; revenue: number; jobs: number }>();
  for (const job of jobs) {
    const entry = customerTotals.get(job.customerId) ?? {
      name: job.customer.fullName,
      revenue: 0,
      jobs: 0,
    };
    entry.revenue += decimalToNumber(job.amountPaid);
    entry.jobs += 1;
    customerTotals.set(job.customerId, entry);
  }
  const topCustomers = Array.from(customerTotals.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1>{t('title')}</h1>
        <p className="mt-1 text-lg text-muted-foreground">{t('subtitle')}</p>
      </div>

      <ReportRangePicker
        defaultFrom={from.toISOString().slice(0, 10)}
        defaultTo={to.toISOString().slice(0, 10)}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('totalIncome')} value={formatPeso(totalIncome, tag)} tone="success" />
        <StatCard label={t('totalBilled')} value={formatPeso(totalBilled, tag)} />
        <StatCard
          label={t('outstanding')}
          value={formatPeso(outstanding, tag)}
          tone={outstanding > 0 ? 'warning' : 'default'}
        />
        <StatCard label={t('jobCount')} value={String(jobs.length)} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" size="lg">
          <a href={`/api/export?format=csv&from=${params.from ?? ''}&to=${params.to ?? ''}`}>
            <Download aria-hidden />
            <span>{t('exportCsv')}</span>
          </a>
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href="/api/export?format=json">
            <Download aria-hidden />
            <span>{t('exportJson')}</span>
          </a>
        </Button>
      </div>
      <p className="-mt-6 text-base text-muted-foreground">{t('exportHint')}</p>

      {jobs.length === 0 ? (
        <EmptyState title={t('empty')} />
      ) : (
        <>
          <Card className="p-6">
            <h2 className="mb-4">{t('monthlyIncome')}</h2>
            <MonthlyIncomeChart data={monthlyRows} />
          </Card>

          <ReportTable
            title={t('dailyIncome')}
            headers={[t('title'), t('totalIncome')]}
            rows={dailyRows.map(([day, amount]) => [
              formatDate(new Date(day), tag),
              formatPeso(amount, tag),
            ])}
          />

          <ReportTable
            title={t('topParts')}
            headers={[t('partName'), t('quantityUsed'), t('timesUsed'), t('revenue')]}
            rows={topParts.map(([name, data]) => [
              name,
              String(data.quantity),
              String(data.times),
              formatPeso(data.amount, tag),
            ])}
          />

          <ReportTable
            title={t('topCustomers')}
            headers={[t('title'), t('jobCount'), t('revenue')]}
            rows={topCustomers.map((c) => [c.name, String(c.jobs), formatPeso(c.revenue, tag)])}
          />
        </>
      )}
    </div>
  );
}

function ReportTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <section className="space-y-3">
      <h2>{title}</h2>
      <div className="overflow-x-auto rounded-xl border-2 border-border">
        <table className="w-full min-w-[32rem]">
          <thead className="bg-muted">
            <tr>
              {headers.map((header, i) => (
                <th
                  key={header}
                  className={`p-4 text-lg font-bold ${i === 0 ? 'text-left' : 'text-right'}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-border">
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, i) => (
                  <td
                    key={i}
                    className={`p-4 text-lg ${i === 0 ? 'text-left' : 'text-right tabular-nums font-semibold'}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
