/**
 * Tests for the money engine.
 *
 * `lib/calc.ts` is the one place a job total is ever produced — the browser
 * shows what it returns, and the server writes what it returns. If these pass,
 * the number the owner reads on screen is the number stored in the database.
 *
 * Run with:  npm test
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeJobTotals,
  computeLineTotal,
  deriveStatus,
  toCentavos,
  toDecimalString,
} from '../lib/calc.ts';

test('toCentavos handles the shapes a form and Prisma actually produce', () => {
  assert.equal(toCentavos(0), 0);
  assert.equal(toCentavos('250'), 25_000);
  assert.equal(toCentavos('250.50'), 25_050);
  assert.equal(toCentavos(1234.56), 123_456);
  assert.equal(toCentavos(''), 0);
  assert.equal(toCentavos(null), 0);
  assert.equal(toCentavos(undefined), 0);
  assert.equal(toCentavos('not a number'), 0);
  // Prisma Decimal arrives as an object with toString().
  assert.equal(toCentavos({ toString: () => '99.99' }), 9_999);
});

test('line total is quantity x unit price', () => {
  assert.equal(computeLineTotal(3, '320.00'), 960);
  assert.equal(computeLineTotal('2', 149.99), 299.98);
  assert.equal(computeLineTotal(0, '500'), 0);
});

test('subtotal adds labour, expenses, parts and services', () => {
  const totals = computeJobTotals({
    laborCharge: '200',
    expenses: '80',
    parts: [
      { quantity: 1, unitPrice: '320.00' },
      { quantity: 2, unitPrice: '55.50' },
    ],
    services: [{ price: '250' }, { price: '850' }],
  });

  // 200 + 80 + (320 + 111) + (250 + 850)
  assert.equal(totals.partsTotal, 431);
  assert.equal(totals.servicesTotal, 1100);
  assert.equal(totals.subtotal, 1811);
  assert.equal(totals.total, 1811);
});

test('discount comes off the subtotal to give the total', () => {
  const totals = computeJobTotals({
    laborCharge: '1000',
    discount: '150.50',
  });
  assert.equal(totals.subtotal, 1000);
  assert.equal(totals.total, 849.5);
});

test('balance is total minus amount paid', () => {
  const totals = computeJobTotals({ services: [{ price: '1000' }], amountPaid: '400' });
  assert.equal(totals.total, 1000);
  assert.equal(totals.balance, 600);
});

test('status follows the specified order: PAID, then UNPAID, then PARTIAL', () => {
  // Paid in full.
  assert.equal(computeJobTotals({ services: [{ price: '500' }], amountPaid: '500' }).status, 'PAID');
  // Overpaid still counts as PAID (balance <= 0).
  assert.equal(computeJobTotals({ services: [{ price: '500' }], amountPaid: '600' }).status, 'PAID');
  // Nothing paid.
  assert.equal(computeJobTotals({ services: [{ price: '500' }] }).status, 'UNPAID');
  // Something, but not all.
  assert.equal(
    computeJobTotals({ services: [{ price: '500' }], amountPaid: '100' }).status,
    'PARTIAL',
  );
  // An empty job has a zero balance, so by the rule it is PAID.
  assert.equal(computeJobTotals({}).status, 'PAID');
});

test('deriveStatus applies the rule directly on centavos', () => {
  assert.equal(deriveStatus(0, 0), 'PAID');
  assert.equal(deriveStatus(-100, 50_000), 'PAID');
  assert.equal(deriveStatus(50_000, 0), 'UNPAID');
  assert.equal(deriveStatus(25_000, 25_000), 'PARTIAL');
});

test('repeated awkward amounts do not drift', () => {
  // Ten lines of 0.07 must be exactly 0.70, not 0.7000000000000001.
  const totals = computeJobTotals({
    services: Array.from({ length: 10 }, () => ({ price: '0.07' })),
  });
  assert.equal(totals.subtotal, 0.7);
  assert.equal(toDecimalString(totals.subtotal), '0.70');

  // A classic float trap: 1.005 must round to 1.01, not 1.00.
  assert.equal(toDecimalString('1.005'), '1.01');
});

test('a realistic job matches what the receipt should print', () => {
  const totals = computeJobTotals({
    laborCharge: '350',
    expenses: '80',
    discount: '0',
    amountPaid: '3380',
    parts: [{ quantity: 1, unitPrice: '1450' }],
    services: [{ price: '1500' }, { price: '1200' }],
  });

  assert.equal(totals.subtotal, 4580); // 350 + 80 + 1450 + 2700
  assert.equal(totals.total, 4580);
  assert.equal(totals.balance, 1200);
  assert.equal(totals.status, 'PARTIAL');
});

test('negative or nonsense input can never produce a negative line', () => {
  assert.equal(computeLineTotal(-5, '100'), 0);
  assert.equal(computeJobTotals({ parts: [{ quantity: -3, unitPrice: '100' }] }).partsTotal, 0);
});

test('toDecimalString always gives the database exactly two decimals', () => {
  assert.equal(toDecimalString(0), '0.00');
  assert.equal(toDecimalString('1250'), '1250.00');
  assert.equal(toDecimalString(1250.5), '1250.50');
  assert.equal(toDecimalString('0.999'), '1.00');
});
