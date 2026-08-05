'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { UserPlus, Save, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { saveCustomerAction } from '@/app/(app)/customers/actions';

export interface CustomerFormValues {
  id?: string;
  fullName: string;
  phone: string;
  address: string;
  notes: string;
}

const EMPTY: CustomerFormValues = { fullName: '', phone: '', address: '', notes: '' };

/** Add or edit a customer, in a dialog so the list stays in view behind it. */
export function CustomerFormDialog({
  initial,
  triggerVariant = 'default',
}: {
  initial?: CustomerFormValues;
  triggerVariant?: 'default' | 'outline';
}) {
  const t = useTranslations('customers');
  const tcom = useTranslations('common');
  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState<CustomerFormValues>(initial ?? EMPTY);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const isEdit = Boolean(initial?.id);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!values.fullName.trim()) {
      setError(t('fullName'));
      return;
    }
    startTransition(async () => {
      const result = await saveCustomerAction({
        id: initial?.id,
        fullName: values.fullName,
        phone: values.phone,
        address: values.address,
        notes: values.notes,
      });
      if (!result.ok) {
        toast.error(tcom('unknownError'));
        return;
      }
      toast.success(isEdit ? t('updated') : t('created'));
      setOpen(false);
      if (!isEdit) setValues(EMPTY);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        variant={triggerVariant}
        size={isEdit ? 'compact' : 'lg'}
        onClick={() => {
          setValues(initial ?? EMPTY);
          setError(null);
          setOpen(true);
        }}
      >
        {isEdit ? <Pencil aria-hidden /> : <UserPlus aria-hidden />}
        <span>{isEdit ? tcom('edit') : t('add')}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent closeLabel={tcom('close')}>
          <DialogHeader>
            <DialogTitle>{isEdit ? t('editTitle') : t('addTitle')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-5">
            <Field label={t('fullName')} htmlFor="cf-name" error={error}>
              <Input
                id="cf-name"
                value={values.fullName}
                onChange={(e) => {
                  setValues((v) => ({ ...v, fullName: e.target.value }));
                  setError(null);
                }}
                autoFocus
              />
            </Field>

            <Field label={t('phone')} hint={tcom('optional')} htmlFor="cf-phone">
              <Input
                id="cf-phone"
                inputMode="tel"
                value={values.phone}
                onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
              />
            </Field>

            <Field label={t('address')} hint={tcom('optional')} htmlFor="cf-address">
              <Input
                id="cf-address"
                value={values.address}
                onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))}
              />
            </Field>

            <Field label={t('notes')} hint={tcom('optional')} htmlFor="cf-notes">
              <Textarea
                id="cf-notes"
                value={values.notes}
                onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
              />
            </Field>

            <DialogFooter>
              <Button type="submit" size="lg" disabled={pending} className="sm:flex-1">
                <Save aria-hidden />
                <span>{pending ? tcom('saving') : tcom('save')}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                <span>{tcom('cancel')}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
