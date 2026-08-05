import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Search, Car } from 'lucide-react';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePageUser } from '@/lib/session';
import { describeVehicle } from '@/lib/jobs';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';
import { VehicleFormDialog } from '@/components/forms/vehicle-form';

export const metadata = { title: 'Vehicles — AutoCare' };
export const dynamic = 'force-dynamic';

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePageUser();
  const { q } = await searchParams;
  const [t, tcom] = await Promise.all([
    getTranslations('vehicles'),
    getTranslations('common'),
  ]);

  const where: Prisma.VehicleWhereInput = q
    ? {
        OR: [
          { plateNumber: { contains: q, mode: 'insensitive' } },
          { customer: { fullName: { contains: q, mode: 'insensitive' } } },
        ],
      }
    : {};

  const [vehicles, customers] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: { plateNumber: 'asc' },
      take: 200,
      include: {
        customer: { select: { id: true, fullName: true } },
        _count: { select: { jobs: true } },
      },
    }),
    prisma.customer.findMany({ orderBy: { fullName: 'asc' }, select: { id: true, fullName: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1>{t('title')}</h1>
          <p className="mt-1 text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>
        <VehicleFormDialog customers={customers} />
      </div>

      <form className="rounded-xl border-2 border-border bg-muted/30 p-5">
        <Field label={tcom('search')} htmlFor="vehicle-search">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="vehicle-search"
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

      {vehicles.length === 0 ? (
        <EmptyState title={q ? tcom('noResults') : t('empty')} icon={<Car className="size-12" />} />
      ) : (
        <ul className="space-y-3">
          {vehicles.map((vehicle) => (
            <li
              key={vehicle.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border-2 border-border bg-background p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold">{vehicle.plateNumber}</p>
                <p className="truncate text-base text-muted-foreground">
                  {describeVehicle(vehicle).replace(`${vehicle.plateNumber} — `, '') || '—'}
                </p>
                <Link
                  href={`/customers/${vehicle.customer.id}`}
                  className="text-base font-semibold text-primary underline underline-offset-4 hover:no-underline"
                >
                  {vehicle.customer.fullName}
                </Link>
              </div>
              <VehicleFormDialog
                customers={customers}
                initial={{
                  id: vehicle.id,
                  customerId: vehicle.customerId,
                  plateNumber: vehicle.plateNumber,
                  make: vehicle.make ?? '',
                  model: vehicle.model ?? '',
                  year: vehicle.year ? String(vehicle.year) : '',
                  color: vehicle.color ?? '',
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
