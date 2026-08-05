/**
 * Money maths for AutoCare.
 *
 * This module is the ONLY place where a job total is calculated. It is imported
 * unchanged by the browser (for the live total in the wizard) and by the server
 * (which recomputes authoritatively before writing to the database). The user
 * can never type a total: it is always derived here.
 *
 * All arithmetic happens in integer centavos so that repeated additions of
 * values like 149.99 cannot drift.
 *
 *   subtotal = laborCharge + expenses + sum(parts.lineTotal) + sum(services.price)
 *   total    = subtotal - discount
 *   balance  = total - amountPaid
 *   status   = PAID if balance <= 0 ; UNPAID if amountPaid == 0 ; else PARTIAL
 */

export type JobStatusValue = 'PAID' | 'UNPAID' | 'PARTIAL';

/** Anything that might arrive from a form field or a Prisma Decimal column. */
export type MoneyLike = number | string | null | undefined | { toString(): string };

export interface PartLineInput {
  partName?: string;
  quantity: number | string;
  unitPrice: MoneyLike;
}

export interface ServiceLineInput {
  serviceName?: string;
  price: MoneyLike;
}

export interface JobTotalsInput {
  laborCharge?: MoneyLike;
  expenses?: MoneyLike;
  discount?: MoneyLike;
  amountPaid?: MoneyLike;
  parts?: PartLineInput[];
  services?: ServiceLineInput[];
}

export interface JobTotals {
  partsTotal: number;
  servicesTotal: number;
  laborCharge: number;
  expenses: number;
  discount: number;
  subtotal: number;
  total: number;
  amountPaid: number;
  balance: number;
  status: JobStatusValue;
}

/** Convert any money-ish value to whole centavos. Invalid input becomes 0. */
export function toCentavos(value: MoneyLike): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(value.toString());
  if (!Number.isFinite(n)) return 0;
  // Nudge away from binary-float boundaries (e.g. 1.005 * 100 === 100.49999…).
  return Math.round((n + Number.EPSILON * Math.sign(n || 1)) * 100);
}

/** Convert whole centavos back to a peso number with exactly 2 decimals. */
export function toPesos(centavos: number): number {
  return Math.round(centavos) / 100;
}

/** Coerce a quantity field to a non-negative whole number. */
export function toQuantity(value: number | string | null | undefined): number {
  const n = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

/** lineTotal = quantity x unitPrice, rounded to the centavo. */
export function computeLineTotal(quantity: number | string, unitPrice: MoneyLike): number {
  return toPesos(toQuantity(quantity) * toCentavos(unitPrice));
}

/**
 * The single source of truth for a job's money figures.
 * Pure: no I/O, no dependency on Prisma, safe in a client component.
 */
export function computeJobTotals(input: JobTotalsInput): JobTotals {
  const partsCentavos = (input.parts ?? []).reduce(
    (sum, part) => sum + toQuantity(part.quantity) * toCentavos(part.unitPrice),
    0,
  );

  const servicesCentavos = (input.services ?? []).reduce(
    (sum, service) => sum + toCentavos(service.price),
    0,
  );

  const laborCentavos = toCentavos(input.laborCharge);
  const expensesCentavos = toCentavos(input.expenses);
  const discountCentavos = toCentavos(input.discount);
  const amountPaidCentavos = toCentavos(input.amountPaid);

  const subtotalCentavos =
    laborCentavos + expensesCentavos + partsCentavos + servicesCentavos;
  const totalCentavos = subtotalCentavos - discountCentavos;
  const balanceCentavos = totalCentavos - amountPaidCentavos;

  return {
    partsTotal: toPesos(partsCentavos),
    servicesTotal: toPesos(servicesCentavos),
    laborCharge: toPesos(laborCentavos),
    expenses: toPesos(expensesCentavos),
    discount: toPesos(discountCentavos),
    subtotal: toPesos(subtotalCentavos),
    total: toPesos(totalCentavos),
    amountPaid: toPesos(amountPaidCentavos),
    balance: toPesos(balanceCentavos),
    status: deriveStatus(balanceCentavos, amountPaidCentavos),
  };
}

/**
 * Status rule, in the exact order specified:
 *   PAID if balance <= 0 ; UNPAID if amountPaid == 0 ; otherwise PARTIAL.
 */
export function deriveStatus(balanceCentavos: number, amountPaidCentavos: number): JobStatusValue {
  if (balanceCentavos <= 0) return 'PAID';
  if (amountPaidCentavos === 0) return 'UNPAID';
  return 'PARTIAL';
}

/**
 * Format a peso amount for display. The currency is always PHP; only the digit
 * grouping follows the viewer's language.
 */
export function formatPeso(value: MoneyLike, locale = 'en-PH'): string {
  const amount = toPesos(toCentavos(value));
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₱${amount.toFixed(2)}`;
  }
}

/** Render a money value the way the database wants it: a fixed 2-decimal string. */
export function toDecimalString(value: MoneyLike): string {
  return toPesos(toCentavos(value)).toFixed(2);
}
