'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WIZARD_STEPS, type WizardStep } from './wizard-types';

const STEP_LABEL_KEYS: Record<WizardStep, string> = {
  customer: 'stepCustomer',
  vehicle: 'stepVehicle',
  services: 'stepServices',
  parts: 'stepParts',
  charges: 'stepCharges',
  payment: 'stepPayment',
  review: 'stepReview',
};

/**
 * Progress indicator. On a phone it collapses to "Step 3 of 7" plus a bar,
 * because seven labelled dots would be too small to read.
 */
export function Stepper({ current }: { current: WizardStep }) {
  const t = useTranslations('wizard');
  const index = WIZARD_STEPS.indexOf(current);
  const total = WIZARD_STEPS.length;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-extrabold">{t(STEP_LABEL_KEYS[current] as never)}</h1>
        <p className="shrink-0 text-lg font-semibold text-muted-foreground">
          {t('stepOf', { current: index + 1, total })}
        </p>
      </div>

      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={index + 1}
        aria-label={t('stepOf', { current: index + 1, total })}
      >
        {WIZARD_STEPS.map((step, i) => (
          <span
            key={step}
            className={cn(
              'h-3 flex-1 rounded-full transition-colors',
              i < index ? 'bg-success' : i === index ? 'bg-primary' : 'bg-muted',
            )}
          />
        ))}
      </div>

      {/* Full labels once there is room for them. */}
      <ol className="hidden flex-wrap gap-x-4 gap-y-1 text-base text-muted-foreground lg:flex">
        {WIZARD_STEPS.map((step, i) => (
          <li
            key={step}
            className={cn(
              'flex items-center gap-1.5',
              i === index && 'font-bold text-primary',
              i < index && 'text-success',
            )}
          >
            {i < index ? <Check className="size-5" aria-hidden /> : null}
            {t(STEP_LABEL_KEYS[step] as never)}
          </li>
        ))}
      </ol>
    </div>
  );
}
