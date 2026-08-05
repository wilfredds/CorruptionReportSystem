'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Search, UserPlus, Check, Car, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/misc';
import { cn } from '@/lib/utils';
import { describeVehicle } from '@/lib/jobs';
import type { CustomerOption, VehicleOption } from './wizard-types';

/* ------------------------------------------------------------------ step 1 */

/**
 * Choose the customer.
 *
 * A returning customer is found by typing a few letters and tapping a row —
 * their name is never re-typed. "New Customer" is only for genuinely new
 * people, and asks for one required field (the name).
 */
export function CustomerStep({
  customers,
  selectedId,
  onSelect,
  onClear,
  onCreate,
  creating,
}: {
  customers: CustomerOption[];
  selectedId: string | null;
  onSelect: (customer: CustomerOption) => void;
  /** Deselect the current customer so the search list comes back. */
  onClear: () => void;
  onCreate: (input: { fullName: string; phone: string; address: string }) => Promise<void>;
  creating: boolean;
}) {
  const t = useTranslations('wizard');
  const tc = useTranslations('customers');
  const tcom = useTranslations('common');

  const [query, setQuery] = React.useState('');
  const [showNew, setShowNew] = React.useState(false);
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [nameError, setNameError] = React.useState<string | null>(null);

  const selected = customers.find((c) => c.id === selectedId) ?? null;

  const matches = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? customers.filter(
          (c) => c.fullName.toLowerCase().includes(q) || (c.phone ?? '').toLowerCase().includes(q),
        )
      : customers;
    return pool.slice(0, 40);
  }, [customers, query]);

  if (selected && !showNew) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">{t('customerSelected')}</h2>
        <div className="rounded-xl border-2 border-success bg-success/5 p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
              <Check className="size-8" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-bold">{selected.fullName}</p>
              {selected.phone ? (
                <p className="text-lg text-muted-foreground">{selected.phone}</p>
              ) : null}
            </div>
          </div>
        </div>
        <Button variant="outline" size="lg" onClick={onClear}>
          <Pencil aria-hidden />
          <span>{t('customerChange')}</span>
        </Button>
      </div>
    );
  }

  if (showNew) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">{tc('addTitle')}</h2>

        <Field label={tc('fullName')} htmlFor="new-customer-name" error={nameError}>
          <Input
            id="new-customer-name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setNameError(null);
            }}
            autoFocus
          />
        </Field>

        <Field label={tc('phone')} hint={tcom('optional')} htmlFor="new-customer-phone">
          <Input
            id="new-customer-phone"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>

        <Field label={tc('address')} hint={tcom('optional')} htmlFor="new-customer-address">
          <Input
            id="new-customer-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Field>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="flex-1"
            disabled={creating}
            onClick={async () => {
              if (!fullName.trim()) {
                setNameError(tcom('required'));
                return;
              }
              await onCreate({ fullName: fullName.trim(), phone, address });
              setShowNew(false);
              setFullName('');
              setPhone('');
              setAddress('');
            }}
          >
            <Check aria-hidden />
            <span>{creating ? tcom('saving') : tcom('save')}</span>
          </Button>
          <Button variant="outline" size="lg" onClick={() => setShowNew(false)} disabled={creating}>
            <span>{tcom('cancel')}</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t('customerQuestion')}</h2>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('customerSearch')}
          aria-label={t('customerSearch')}
          className="pl-14"
          autoComplete="off"
        />
      </div>

      <Button variant="secondary" size="lg" className="w-full" onClick={() => setShowNew(true)}>
        <UserPlus aria-hidden />
        <span>{t('customerNew')}</span>
      </Button>

      {matches.length === 0 ? (
        <EmptyState title={t('customerNoResults')} />
      ) : (
        <ul className="space-y-3">
          {matches.map((customer) => (
            <li key={customer.id}>
              <button
                type="button"
                onClick={() => onSelect(customer)}
                className={cn(
                  'flex min-h-tap w-full items-center justify-between gap-4 rounded-lg border-2 border-border',
                  'bg-background px-5 py-4 text-left hover:border-primary hover:bg-accent',
                  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring',
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-xl font-bold">{customer.fullName}</span>
                  <span className="block truncate text-base text-muted-foreground">
                    {[customer.phone, `${customer.vehicles.length} ${customer.vehicles.length === 1 ? '🚗' : '🚗'}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <Check className="size-6 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ step 2 */

/**
 * Choose the vehicle. Only this customer's vehicles are offered, so a plate
 * number is never re-typed for a returning customer.
 */
export function VehicleStep({
  vehicles,
  selectedId,
  onSelect,
  onCreate,
  creating,
}: {
  vehicles: VehicleOption[];
  selectedId: string | null;
  onSelect: (vehicleId: string) => void;
  onCreate: (input: {
    plateNumber: string;
    make: string;
    model: string;
    color: string;
  }) => Promise<void>;
  creating: boolean;
}) {
  const t = useTranslations('wizard');
  const tv = useTranslations('vehicles');
  const tcom = useTranslations('common');

  const [showNew, setShowNew] = React.useState(vehicles.length === 0);
  const [plateNumber, setPlateNumber] = React.useState('');
  const [make, setMake] = React.useState('');
  const [model, setModel] = React.useState('');
  const [color, setColor] = React.useState('');
  const [plateError, setPlateError] = React.useState<string | null>(null);

  if (showNew) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">{tv('addTitle')}</h2>

        <Field label={tv('plateNumber')} htmlFor="new-plate" error={plateError}>
          <Input
            id="new-plate"
            value={plateNumber}
            onChange={(e) => {
              setPlateNumber(e.target.value.toUpperCase());
              setPlateError(null);
            }}
            autoCapitalize="characters"
            autoFocus
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={tv('make')} hint={tcom('optional')} htmlFor="new-make">
            <Input id="new-make" value={make} onChange={(e) => setMake(e.target.value)} />
          </Field>
          <Field label={tv('model')} hint={tcom('optional')} htmlFor="new-model">
            <Input id="new-model" value={model} onChange={(e) => setModel(e.target.value)} />
          </Field>
        </div>

        <Field label={tv('color')} hint={tcom('optional')} htmlFor="new-color">
          <Input id="new-color" value={color} onChange={(e) => setColor(e.target.value)} />
        </Field>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="flex-1"
            disabled={creating}
            onClick={async () => {
              if (!plateNumber.trim()) {
                setPlateError(tcom('required'));
                return;
              }
              await onCreate({ plateNumber: plateNumber.trim(), make, model, color });
              setShowNew(false);
              setPlateNumber('');
              setMake('');
              setModel('');
              setColor('');
            }}
          >
            <Check aria-hidden />
            <span>{creating ? tcom('saving') : tcom('save')}</span>
          </Button>
          {vehicles.length > 0 ? (
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowNew(false)}
              disabled={creating}
            >
              <span>{tcom('cancel')}</span>
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t('vehicleQuestion')}</h2>

      <ul className="space-y-3">
        {vehicles.map((vehicle) => {
          const active = vehicle.id === selectedId;
          return (
            <li key={vehicle.id}>
              <button
                type="button"
                onClick={() => onSelect(vehicle.id)}
                aria-pressed={active}
                className={cn(
                  'flex min-h-tap w-full items-center gap-4 rounded-lg border-2 px-5 py-4 text-left',
                  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring',
                  active
                    ? 'border-success bg-success/5'
                    : 'border-border bg-background hover:border-primary hover:bg-accent',
                )}
              >
                <Car
                  className={cn('size-8 shrink-0', active ? 'text-success' : 'text-muted-foreground')}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xl font-bold">{vehicle.plateNumber}</span>
                  <span className="block truncate text-base text-muted-foreground">
                    {describeVehicle(vehicle).replace(`${vehicle.plateNumber} — `, '') ||
                      tcom('none')}
                  </span>
                </span>
                {active ? <Check className="size-7 shrink-0 text-success" aria-hidden /> : null}
              </button>
            </li>
          );
        })}
      </ul>

      <Button variant="secondary" size="lg" className="w-full" onClick={() => setShowNew(true)}>
        <Car aria-hidden />
        <span>{t('vehicleNew')}</span>
      </Button>
    </div>
  );
}
