/** Shared shapes for the New Job wizard. */

export interface CustomerOption {
  id: string;
  fullName: string;
  phone: string | null;
  vehicles: VehicleOption[];
}

export interface VehicleOption {
  id: string;
  plateNumber: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
}

export interface ServiceOption {
  id: string;
  name: string;
  defaultPrice: number;
}

export interface MechanicOption {
  id: string;
  name: string;
}

/** A service line on the job being built. */
export interface DraftService {
  /** Local key for React lists. */
  key: string;
  /** Catalog id, or null for a one-off typed service. */
  serviceId: string | null;
  serviceName: string;
  price: string;
}

/** A spare-part line on the job being built. */
export interface DraftPart {
  key: string;
  partName: string;
  quantity: string;
  unitPrice: string;
}

export interface JobDraft {
  customerId: string | null;
  vehicleId: string | null;
  mechanicId: string | null;
  date: string;
  services: DraftService[];
  parts: DraftPart[];
  laborCharge: string;
  expenses: string;
  discount: string;
  amountPaid: string;
  paymentMethod: 'CASH' | 'GCASH' | 'OTHER' | '';
  notes: string;
}

export function emptyDraft(): JobDraft {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60_000;
  return {
    customerId: null,
    vehicleId: null,
    mechanicId: null,
    date: new Date(today.getTime() - offset).toISOString().slice(0, 10),
    services: [],
    parts: [],
    laborCharge: '',
    expenses: '',
    discount: '',
    amountPaid: '',
    paymentMethod: '',
    notes: '',
  };
}

let counter = 0;
export function nextKey(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}-${Math.random().toString(36).slice(2, 7)}`;
}

export const WIZARD_STEPS = [
  'customer',
  'vehicle',
  'services',
  'parts',
  'charges',
  'payment',
  'review',
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];
