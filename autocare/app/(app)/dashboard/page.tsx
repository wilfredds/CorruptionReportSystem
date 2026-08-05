import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { PlusCircle, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requirePageUser } from '@/lib/session';
import { can } from '@/lib/rbac';
import { formatPeso } from '@/lib/calc';
import { intlTagFor } from '@/i18n/locales';
import { decimalToNumber, startOfDay, endOfDay, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, StatCard } from '@/components/ui/card';
import { Badge, statusVariant } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/misc';
import { MonthlyIncomeChart } from './monthly-chart';
import { DeniedNotice } from './denied-notice';

export const metadata = { title: 'Home — AutoCare' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const user = await requirePageUser();
  const params = await searchParams;
  const [t, tj, tcom, locale] = await Promise.all([
    getTranslations('dashboard'),
    getTranslations('job'),
    getTranslations('common'),
    getLocale(),
  ]);
  const tag = intlTagFor(locale);

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [todayJobs, todayMoney, monthMoney, unpaid, recentJobs, monthlyRows] = await Promise.all([
    prisma.job.count({ where: { date: { gte: todayStart, lte: todayEnd } } }),
    prisma.job.aggregate({
      _sum: { amountPaid: true },
      where: { date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.job.aggregate({
      _sum: { amountPaid: true },
      where: { date: { gte: monthStart, lte: todayEnd } },
    }),
    prisma.job.aggregate({ _sum: { balance: true }, where: { status: { not: 'PAID' } } }),
    prisma.job.findMany({
      orderBy: { date: 'desc' },
      take: 10,
      include: {
        customer: { select: { fullName: true } },
        vehicle: { select: { plateNumber: true } },
      },
    }),
    prisma.job.findMany({
      where: { date: { gte: twelveMonthsAgo } },
      select: { date: true, amountPaid: true },
    }),
  ]);

  // Group into months in JS — 12 rows at most, cheaper than a second round trip.
  const monthly = new Map<string, number>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    monthly.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, 0);
  }
  for (const row of monthlyRows) {
    const key = `${row.date.getFullYear()}-${String(row.date.getMonth() + 1).padStart(2, '0')}`;
    if (monthly.has(key)) {
      monthly.set(key, (monthly.get(key) ?? 0) + decimalToNumber(row.amountPaid));
    }
  }

  const chartData = Array.from(monthly.entries()).map(([key, value]) => {
    const [year, month] = key.split('-').map(Number);
    return {
      label: new Intl.DateTimeFormat(tag, { month: 'short' }).format(new Date(year, month - 1, 1)),
      value,
    };
  });

  return (
    <div className="space-y-8">
      {params.denied === '1' ? <DeniedNotice /> : null}

      <div>
        <h1>{t('greeting', { name: user.name.split(' ')[0] })}</h1>
        <p className="mt-1 text-lg text-muted-foreground">{formatDate(now, tag)}</p>
      </div>

      {/* The single largest, most prominent control on the screen. */}
      <Button asChild size="hero" variant="success">
        <Link href="/jobs/new">
          <PlusCircle aria-hidden />
          <span>{t('recordNewJob')}</span>
        </Link>
      </Button>
      <p className="-mt-4 text-lg text-muted-foreground">{t('recordNewJobHint')}</p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('todayJobs')} value={String(todayJobs)} />
        <StatCard
          label={t('todayIncome')}
          value={formatPeso(decimalToNumber(todayMoney._sum.amountPaid), tag)}
          tone="success"
        />
        <StatCard
          label={t('monthIncome')}
          value={formatPeso(decimalToNumber(monthMoney._sum.amountPaid), tag)}
          tone="success"
        />
        <StatCard
          label={t('unpaidTotal')}
          value={formatPeso(decimalToNumber(unpaid._sum.balance), tag)}
          tone="warning"
        />
      </div>

      {can.viewReports(user.role) ? (
        <Card className="p-6">
          <h2 className="mb-4">{t('monthlyChart')}</h2>
          <MonthlyIncomeChart data={chartData} />
        </Card>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2>{t('recentJobs')}</h2>
          <Button asChild variant="outline" size="compact">
            <Link href="/jobs">
              <span>{tcom('viewAll')}</span>
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>

        {recentJobs.length === 0 ? (
          <EmptyState title={t('noJobsYet')} />
        ) : (
          <ul className="space-y-3">
            {recentJobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="flex min-h-tap flex-wrap items-center justify-between gap-4 rounded-lg border-2 border-border bg-background p-4 hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-bold">
                      {job.customer.fullName}
                    </span>
                    <span className="block truncate text-base text-muted-foreground">
                      {job.vehicle.plateNumber} · {job.jobNumber} ·{' '}
                      {formatDate(job.date, tag)}
                    </span>
                  </span>
                  <span className="flex items-center gap-4">
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
      </section>
    </div>
  );
}
