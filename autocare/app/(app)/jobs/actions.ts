'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';
import { can } from '@/lib/rbac';
import {
  requireUser,
  requireCapability,
  guarded,
  type ActionResult,
} from '@/lib/session';
import { jobSchema, customerSchema, vehicleSchema, fieldErrors } from '@/lib/validation';
import { computeJobTotals, computeLineTotal, toDecimalString } from '@/lib/calc';
import { nextJobNumber } from '@/lib/jobs';
import { decimalToNumber } from '@/lib/utils';

/**
 * Job mutations.
 *
 * Non-negotiable rule in here: subtotal, total, balance and status are NEVER
 * read from the request. They are recomputed from the line items with
 * `computeJobTotals` — the same function that drives the live figure in the
 * browser — right before the write. A client that posts its own total is simply
 * ignored.
 */

export interface SaveJobInput {
  id?: string;
  customerId: string;
  vehicleId: string;
  mechanicId: string | null;
  date: string;
  laborCharge: string;
  expenses: string;
  discount: string;
  amountPaid: string;
  paymentMethod: 'CASH' | 'GCASH' | 'OTHER' | null;
  notes: string;
  parts: { partName: string; quantity: string; unitPrice: string }[];
  services: { serviceId: string | null; serviceName: string; price: string }[];
}

export async function saveJobAction(
  input: SaveJobInput,
): Promise<ActionResult<{ id: string; jobNumber: string }>> {
  return guarded(async () => {
    const user = await requireCapability(can.manageJobs);

    const parsed = jobSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        messageKey: 'common.unknownError',
        fieldErrors: fieldErrors(parsed.error),
      };
    }
    const data = parsed.data;

    // The vehicle must actually belong to the customer — never trust the pair.
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
      select: { id: true, customerId: true },
    });
    if (!vehicle || vehicle.customerId !== data.customerId) {
      return { ok: false, messageKey: 'wizard.missingVehicle' };
    }

    // ---- authoritative recomputation -------------------------------------
    const totals = computeJobTotals({
      laborCharge: data.laborCharge,
      expenses: data.expenses,
      discount: data.discount,
      amountPaid: data.amountPaid,
      parts: data.parts,
      services: data.services,
    });

    const moneyFields = {
      laborCharge: toDecimalString(totals.laborCharge),
      expenses: toDecimalString(totals.expenses),
      discount: toDecimalString(totals.discount),
      subtotal: toDecimalString(totals.subtotal),
      total: toDecimalString(totals.total),
      amountPaid: toDecimalString(totals.amountPaid),
      balance: toDecimalString(totals.balance),
      status: totals.status,
    };

    const partRows = data.parts.map((p) => ({
      partName: p.partName,
      quantity: p.quantity,
      unitPrice: toDecimalString(p.unitPrice),
      lineTotal: toDecimalString(computeLineTotal(p.quantity, p.unitPrice)),
    }));

    const serviceRows = data.services.map((s) => ({
      serviceId: s.serviceId || null,
      serviceName: s.serviceName,
      price: toDecimalString(s.price),
    }));

    const isUpdate = Boolean(input.id);

    const job = await prisma.$transaction(async (tx) => {
      if (isUpdate) {
        // Replace the line items wholesale — simplest correct behaviour, and
        // the job is small enough that it costs nothing.
        await tx.jobPart.deleteMany({ where: { jobId: input.id } });
        await tx.jobService.deleteMany({ where: { jobId: input.id } });

        return tx.job.update({
          where: { id: input.id },
          data: {
            customerId: data.customerId,
            vehicleId: data.vehicleId,
            mechanicId: data.mechanicId,
            date: data.date,
            paymentMethod: data.paymentMethod ?? null,
            notes: data.notes ?? null,
            ...moneyFields,
            parts: { create: partRows },
            services: { create: serviceRows },
          },
          select: { id: true, jobNumber: true },
        });
      }

      const jobNumber = await nextJobNumber(tx, data.date);
      return tx.job.create({
        data: {
          jobNumber,
          customerId: data.customerId,
          vehicleId: data.vehicleId,
          mechanicId: data.mechanicId,
          date: data.date,
          paymentMethod: data.paymentMethod ?? null,
          notes: data.notes ?? null,
          createdById: user.id,
          ...moneyFields,
          parts: { create: partRows },
          services: { create: serviceRows },
        },
        select: { id: true, jobNumber: true },
      });
    });

    await audit({
      userId: user.id,
      action: isUpdate ? 'UPDATE_JOB' : 'CREATE_JOB',
      entity: 'Job',
      entityId: job.id,
      metadata: { jobNumber: job.jobNumber, total: totals.total, status: totals.status },
    });

    revalidatePath('/jobs');
    revalidatePath('/dashboard');
    revalidatePath(`/jobs/${job.id}`);

    return {
      ok: true,
      data: job,
      messageKey: isUpdate ? 'jobs.updated' : 'jobs.saved',
    };
  });
}

export async function deleteJobAction(jobId: string): Promise<ActionResult> {
  return guarded(async () => {
    const user = await requireCapability(can.deleteJobs);

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, jobNumber: true, total: true, customer: { select: { fullName: true } } },
    });
    if (!job) return { ok: false, messageKey: 'errors.notFound' };

    // JobPart and JobService cascade from the Job.
    await prisma.job.delete({ where: { id: jobId } });

    await audit({
      userId: user.id,
      action: 'DELETE_JOB',
      entity: 'Job',
      entityId: jobId,
      metadata: {
        jobNumber: job.jobNumber,
        customer: job.customer.fullName,
        total: decimalToNumber(job.total),
      },
    });

    revalidatePath('/jobs');
    revalidatePath('/dashboard');
    return { ok: true, messageKey: 'jobs.deleted' };
  });
}

/* ------------------------------------------------ inline creation in wizard */

/**
 * Add a customer without leaving the wizard. Deliberately asks for the minimum:
 * a name. Everything else can be filled in later from the Customers page.
 */
export async function createCustomerInline(input: {
  fullName: string;
  phone: string;
  address: string;
}): Promise<ActionResult<{ id: string; fullName: string; phone: string | null }>> {
  return guarded(async () => {
    const user = await requireCapability(can.manageCustomers);

    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, messageKey: 'errors.nameRequired', fieldErrors: fieldErrors(parsed.error) };
    }

    const customer = await prisma.customer.create({
      data: { ...parsed.data, createdById: user.id },
      select: { id: true, fullName: true, phone: true },
    });

    await audit({
      userId: user.id,
      action: 'CREATE_CUSTOMER',
      entity: 'Customer',
      entityId: customer.id,
      metadata: { fullName: customer.fullName, via: 'job-wizard' },
    });

    revalidatePath('/customers');
    return { ok: true, data: customer, messageKey: 'customers.created' };
  });
}

/** Add a vehicle to the chosen customer without leaving the wizard. */
export async function createVehicleInline(input: {
  customerId: string;
  plateNumber: string;
  make: string;
  model: string;
  color: string;
}): Promise<
  ActionResult<{
    id: string;
    plateNumber: string;
    make: string | null;
    model: string | null;
    year: number | null;
    color: string | null;
  }>
> {
  return guarded(async () => {
    const user = await requireCapability(can.manageCustomers);

    const parsed = vehicleSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, messageKey: 'errors.plateRequired', fieldErrors: fieldErrors(parsed.error) };
    }

    const customer = await prisma.customer.findUnique({
      where: { id: parsed.data.customerId },
      select: { id: true },
    });
    if (!customer) return { ok: false, messageKey: 'errors.notFound' };

    const vehicle = await prisma.vehicle.create({
      data: parsed.data,
      select: { id: true, plateNumber: true, make: true, model: true, year: true, color: true },
    });

    await audit({
      userId: user.id,
      action: 'CREATE_VEHICLE',
      entity: 'Vehicle',
      entityId: vehicle.id,
      metadata: { plateNumber: vehicle.plateNumber, via: 'job-wizard' },
    });

    revalidatePath('/vehicles');
    return { ok: true, data: vehicle, messageKey: 'vehicles.created' };
  });
}

/** Used by the Jobs list to confirm the signed-in user before rendering. */
export async function touchSession(): Promise<void> {
  await requireUser();
}
