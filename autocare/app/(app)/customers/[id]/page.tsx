import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { ArrowLeft, PlusCircle, Phone, MapPin } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requirePageUser } from '@/lib/session';
import { can } from '@/lib/rbac';
import { formatPeso } from '@/lib/calc';
import { intlTagFor } from '@/i18n/locales';
import { decimalToNumber, formatDate } from '@/lib/utils';
import { describeVehicle, notDeleted } from '@/lib/jobs';
import { Button } from '@/components/ui/button';
import { Card, StatCard } from '@/components/ui/card';
import { Badge, statusVariant } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/misc';
import { CustomerFormDialog } from '@/components/forms/customer-form';
import { VehicleFormDialog } from '@/components/forms/vehicle-form';
import { DeleteCustomerButton } from './delete-customer-button';

export const dynamic = 'force-dynamic';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser();
  const { id } = await params;

  const [t, tj, tcom, tnav, locale] = await Promise.all([
    getTranslations('customers'),
    getTranslations('job'),
    getTranslations('common'),
    getTranslations('nav'),
    getLocale(),
  ]);
  const tag = intlTagFor(locale);

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      vehicles: { orderBy: { plateNumber: 'asc' } },
      jobs: {
        where: notDeleted,
        orderBy: { date: 'desc' },
        include: { vehicle: { select: { plateNumber: true } } },
      },
    },
  });

  if (!customer) notFound();

  const totalSpent = customer.jobs.reduce((sum, job) => sum + decimalToNumber(job.amountPaid), 0);
  const outstanding = customer.jobs.reduce((sum, job) => sum + decimalToNumber(job.balance), 0);

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="compact">
          <Link href="/customers">
            <ArrowLeft aria-hidden />
            <span>{tcom('back')}</span>
          </Link>
        </Button>
        <h1 className="mt-2">{customer.fullName}</h1>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-lg text-muted-foreground">
          {customer.phone ? (
            <span className="flex items-center gap-2">
              <Phone className="size-5" aria-hidden />
              {customer.phone}
            </span>
          ) : null}
          {customer.address ? (
            <span className="flex items-center gap-2">
              <MapPin className="size-5" aria-hidden />
              {customer.address}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg" variant="success">
          <Link href={`/jobs/new?customer=${customer.id}`}>
            <PlusCircle aria-hidden />
            <span>{tnav('newJob')}</span>
          </Link>
        </Button>
        <CustomerFormDialog
          triggerVariant="outline"
          initial={{
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone ?? '',
            address: customer.address ?? '',
            notes: customer.notes ?? '',
          }}
        />
        {can.deleteCustomers(user.role) ? (
          <DeleteCustomerButton
            customerId={customer.id}
            customerName={customer.fullName}
            jobCount={customer.jobs.length}
          />
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('jobCount')} value={String(customer.jobs.length)} />
        <StatCard label={t('totalSpent')} value={formatPeso(totalSpent, tag)} tone="success" />
        <StatCard
          label={tj('balance')}
          value={formatPeso(outstanding, tag)}
          tone={outstanding > 0 ? 'warning' : 'default'}
        />
      </div>

      {customer.notes ? (
        <Card className="p-5">
          <p className="text-base font-semibold text-muted-foreground">{t('notes')}</p>
          <p className="mt-1 whitespace-pre-wrap text-lg">{customer.notes}</p>
        </Card>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2>{t('vehicles')}</h2>
          <VehicleFormDialog lockedCustomerId={customer.id} />
        </div>

        {customer.vehicles.length === 0 ? (
          <EmptyState title={t('noVehicles')} />
        ) : (
          <ul className="space-y-3">
            {customer.vehicles.map((vehicle) => (
              <li
                key={vehicle.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border-2 border-border bg-background p-4"
              >
                <span className="min-w-0">
                  <span className="block truncate text-lg font-bold">{vehicle.plateNumber}</span>
                  <span className="block truncate text-base text-muted-foreground">
                    {describeVehicle(vehicle).replace(`${vehicle.plateNumber} — `, '') ||
                      tcom('notSet')}
                  </span>
                </span>
                <VehicleFormDialog
                  lockedCustomerId={customer.id}
                  initial={{
                    id: vehicle.id,
                    customerId: customer.id,
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
      </section>

      <section className="space-y-4">
        <h2>{t('jobHistory')}</h2>
        {customer.jobs.length === 0 ? (
          <EmptyState title={t('noJobs')} />
        ) : (
          <ul className="space-y-3">
            {customer.jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="flex min-h-tap flex-wrap items-center justify-between gap-4 lift rounded-lg border-2 border-border bg-background p-4 hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-bold">{job.jobNumber}</span>
                    <span className="block truncate text-base text-muted-foreground">
                      {job.vehicle.plateNumber} · {formatDate(job.date, tag)}
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
