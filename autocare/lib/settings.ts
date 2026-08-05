import { prisma } from './prisma';

/**
 * Shop details printed on every receipt. Stored in a single row so the owner
 * can change them from the Settings page without a redeploy.
 */

export interface ShopInfo {
  name: string;
  address: string;
  phone: string;
  email: string | null;
  footer: string | null;
}

/** Used on a brand-new database, before Settings has ever been saved. */
export const DEFAULT_SHOP: ShopInfo = {
  name: 'HI-OCTEN CAR CARE SERVICES',
  address:
    'Blk 4 Lot 3, Villa Acacia St., Bayview Subd., Amaya I, Tanza, Cavite (going Starfish Beach)',
  phone: '09989800388',
  email: null,
  footer: null,
};

export const SHOP_SETTINGS_ID = 'shop';

export async function getShopInfo(): Promise<ShopInfo> {
  try {
    const row = await prisma.shopSetting.findUnique({ where: { id: SHOP_SETTINGS_ID } });
    if (!row) return DEFAULT_SHOP;
    return {
      name: row.name,
      address: row.address,
      phone: row.phone,
      email: row.email,
      footer: row.footer,
    };
  } catch {
    // The Settings page must never take the whole app down if the row is missing.
    return DEFAULT_SHOP;
  }
}
