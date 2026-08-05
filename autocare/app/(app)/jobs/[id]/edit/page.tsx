import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { requirePageUser } from '@/lib/session';
import { decimalToNumber } from '@/lib/utils';
import { toDateInputValue } from '@/lib/utils';
import { EditJobForm } from './edit-job-form';

export const dynamic = 'force-dynamic';

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser();
  const { id } = await params;

  const [job, t] = await Promise.all([
    prisma.job.findUnique({
      where: { id },
      include: {
        parts: true,
        services: true,
        customer: { select: { id: true, fullName: true } },
        vehicle: { select: { id: true, plateNumber: true, make: true, model: true, color: true, year: true } },
      },
    }),
    getTranslations('jobs'),
  ]);

  if (!job) notFound();

  const [catalog, mechanics, vehicles] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, defaultPrice: true },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.vehicle.findMany({
      where: { customerId: job.customerId },
      orderBy: { plateNumber: 'asc' },
      select: { id: true, plateNumber: true, make: true, model: true, year: true, color: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1>{t('editTitle', { number: job.jobNumber })}</h1>

      <EditJobForm
        jobId={job.id}
        customerName={job.customer.fullName}
        customerId={job.customerId}
        vehicles={vehicles}
        catalog={catalog.map((s) => ({
          id: s.id,
          name: s.name,
          defaultPrice: decimalToNumber(s.defaultPrice),
        }))}
        mechanics={mechanics}
        initial={{
          vehicleId: job.vehicleId,
          mechanicId: job.mechanicId,
          date: toDateInputValue(job.date),
          laborCharge: decimalToNumber(job.laborCharge).toFixed(2),
          expenses: decimalToNumber(job.expenses).toFixed(2),
          discount: decimalToNumber(job.discount).toFixed(2),
          amountPaid: decimalToNumber(job.amountPaid).toFixed(2),
          paymentMethod: job.paymentMethod ?? '',
          notes: job.notes ?? '',
          services: job.services.map((s) => ({
            key: s.id,
            serviceId: s.serviceId,
            serviceName: s.serviceName,
            price: decimalToNumber(s.price).toFixed(2),
          })),
          parts: job.parts.map((p) => ({
            key: p.id,
            partName: p.partName,
            quantity: String(p.quantity),
            unitPrice: decimalToNumber(p.unitPrice).toFixed(2),
          })),
        }}
      />
    </div>
  );
}
