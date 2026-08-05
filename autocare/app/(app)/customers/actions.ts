'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';
import { can } from '@/lib/rbac';
import { requireCapability, guarded, type ActionResult } from '@/lib/session';
import { customerSchema, fieldErrors } from '@/lib/validation';

export async function saveCustomerAction(input: {
  id?: string;
  fullName: string;
  phone?: string;
  address?: string;
  notes?: string;
}): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const user = await requireCapability(can.manageCustomers);

    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        messageKey: 'errors.nameRequired',
        fieldErrors: fieldErrors(parsed.error),
      };
    }

    const isUpdate = Boolean(input.id);

    const customer = isUpdate
      ? await prisma.customer.update({
          where: { id: input.id },
          data: parsed.data,
          select: { id: true, fullName: true },
        })
      : await prisma.customer.create({
          data: { ...parsed.data, createdById: user.id },
          select: { id: true, fullName: true },
        });

    await audit({
      userId: user.id,
      action: isUpdate ? 'UPDATE_CUSTOMER' : 'CREATE_CUSTOMER',
      entity: 'Customer',
      entityId: customer.id,
      metadata: { fullName: customer.fullName },
    });

    revalidatePath('/customers');
    revalidatePath(`/customers/${customer.id}`);
    return {
      ok: true,
      data: { id: customer.id },
      messageKey: isUpdate ? 'customers.updated' : 'customers.created',
    };
  });
}

/**
 * Delete a customer. Refused outright while they still have jobs on record —
 * losing a customer would orphan their receipts, so the owner is told to edit
 * instead. Vehicles cascade with the customer.
 */
export async function deleteCustomerAction(customerId: string): Promise<ActionResult> {
  return guarded(async () => {
    const user = await requireCapability(can.deleteCustomers);

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, fullName: true, _count: { select: { jobs: true } } },
    });
    if (!customer) return { ok: false, messageKey: 'errors.notFound' };

    if (customer._count.jobs > 0) {
      return { ok: false, messageKey: 'customers.deleteBlocked' };
    }

    await prisma.customer.delete({ where: { id: customerId } });

    await audit({
      userId: user.id,
      action: 'DELETE_CUSTOMER',
      entity: 'Customer',
      entityId: customerId,
      metadata: { fullName: customer.fullName },
    });

    revalidatePath('/customers');
    return { ok: true, messageKey: 'customers.deleted' };
  });
}
