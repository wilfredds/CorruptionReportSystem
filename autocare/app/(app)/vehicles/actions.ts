'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';
import { can } from '@/lib/rbac';
import { requireCapability, guarded, type ActionResult } from '@/lib/session';
import { vehicleSchema, fieldErrors } from '@/lib/validation';

export async function saveVehicleAction(input: {
  id?: string;
  customerId: string;
  plateNumber: string;
  make?: string;
  model?: string;
  year?: string;
  color?: string;
}): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const user = await requireCapability(can.manageCustomers);

    const parsed = vehicleSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        messageKey: 'errors.plateRequired',
        fieldErrors: fieldErrors(parsed.error),
      };
    }

    const customer = await prisma.customer.findUnique({
      where: { id: parsed.data.customerId },
      select: { id: true },
    });
    if (!customer) return { ok: false, messageKey: 'errors.notFound' };

    const isUpdate = Boolean(input.id);

    const vehicle = isUpdate
      ? await prisma.vehicle.update({
          where: { id: input.id },
          data: parsed.data,
          select: { id: true, plateNumber: true },
        })
      : await prisma.vehicle.create({
          data: parsed.data,
          select: { id: true, plateNumber: true },
        });

    await audit({
      userId: user.id,
      action: isUpdate ? 'UPDATE_VEHICLE' : 'CREATE_VEHICLE',
      entity: 'Vehicle',
      entityId: vehicle.id,
      metadata: { plateNumber: vehicle.plateNumber },
    });

    revalidatePath('/vehicles');
    revalidatePath(`/customers/${parsed.data.customerId}`);
    return {
      ok: true,
      data: { id: vehicle.id },
      messageKey: isUpdate ? 'vehicles.updated' : 'vehicles.created',
    };
  });
}

export async function deleteVehicleAction(vehicleId: string): Promise<ActionResult> {
  return guarded(async () => {
    const user = await requireCapability(can.deleteCustomers);

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        id: true,
        plateNumber: true,
        customerId: true,
        _count: { select: { jobs: true } },
      },
    });
    if (!vehicle) return { ok: false, messageKey: 'errors.notFound' };

    // A vehicle with history stays: deleting it would break its receipts.
    if (vehicle._count.jobs > 0) {
      return { ok: false, messageKey: 'vehicles.deleteBlocked' };
    }

    await prisma.vehicle.delete({ where: { id: vehicleId } });

    await audit({
      userId: user.id,
      action: 'DELETE_VEHICLE',
      entity: 'Vehicle',
      entityId: vehicleId,
      metadata: { plateNumber: vehicle.plateNumber },
    });

    revalidatePath('/vehicles');
    revalidatePath(`/customers/${vehicle.customerId}`);
    return { ok: true, messageKey: 'vehicles.deleted' };
  });
}
