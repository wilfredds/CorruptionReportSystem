import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Search, ArrowRight } from 'lucide-react';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePageUser } from '@/lib/session';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';
import { CustomerFormDialog } from '@/components/forms/customer-form';

export const metadata = { title: 'Customers — AutoCare' };
export const dynamic = 'force-dynamic';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePageUser();
  const { q } = await searchParams;
  const [t, tcom] = await Promise.all([
    getTranslations('customers'),
    getTranslations('common'),
  ]);

  const where: Prisma.CustomerWhereInput = q
    ? {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { fullName: 'asc' },
    take: 200,
    include: {
      _count: { select: { vehicles: true, jobs: true } },
      vehicles: { select: { plateNumber: true }, take: 3 },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1>{t('title')}</h1>
          <p className="mt-1 text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>
        <CustomerFormDialog />
      </div>

      {/* A plain GET form keeps search working even without JavaScript. */}
      <form className="rounded-xl border-2 border-border bg-muted/30 p-5">
        <Field label={tcom('search')} htmlFor="customer-search">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="customer-search"
                name="q"
                defaultValue={q ?? ''}
                placeholder={t('searchPlaceholder')}
                className="pl-14"
              />
            </div>
            <Button type="submit" size="default">
              <Search aria-hidden />
              <span>{tcom('search')}</span>
            </Button>
          </div>
        </Field>
      </form>

      {customers.length === 0 ? (
        <EmptyState title={q ? tcom('noResults') : t('empty')} />
      ) : (
        <ul className="space-y-3">
          {customers.map((customer) => (
            <li key={customer.id}>
              <Link
                href={`/customers/${customer.id}`}
                className="flex min-h-tap flex-wrap items-center justify-between gap-4 rounded-lg border-2 border-border bg-background p-4 hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-bold">{customer.fullName}</span>
                  <span className="block truncate text-base text-muted-foreground">
                    {[
                      customer.phone,
                      customer.vehicles.map((v) => v.plateNumber).join(', '),
                    ]
                      .filter(Boolean)
                      .join(' · ') || tcom('notSet')}
                  </span>
                </span>
                <span className="flex items-center gap-4">
                  <span className="text-base text-muted-foreground">
                    {t('jobCount')}: <strong className="text-foreground">{customer._count.jobs}</strong>
                  </span>
                  <ArrowRight className="size-6 text-muted-foreground" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
