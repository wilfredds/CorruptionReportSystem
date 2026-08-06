'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { PasswordFields, passwordReady } from '@/components/forms/password-fields';
import { changeOwnPasswordAction } from './actions';

/**
 * Change your own password.
 *
 * On success the server has bumped `tokenVersion`, which signs out every other
 * device. This browser is kept signed in by pushing the new value into the JWT
 * with `update()` before navigating — otherwise the next request would find a
 * token a generation behind and log this browser out too.
 */
export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const t = useTranslations('account');
  const tcom = useTranslations('common');
  const router = useRouter();
  const { update } = useSession();

  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const ready = current.length > 0 && passwordReady(next, confirm);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;
    setError(null);

    startTransition(async () => {
      const result = await changeOwnPasswordAction({
        currentPassword: current,
        newPassword: next,
      });

      if (!result.ok) {
        const key = result.messageKey;
        setError(
          key === 'account.wrongCurrentPassword'
            ? t('wrongCurrentPassword')
            : key === 'account.sameAsOld'
              ? t('sameAsOld')
              : tcom('unknownError'),
        );
        return;
      }

      // Catch this browser's token up to the version the server just wrote,
      // before navigating anywhere. Every other device stays signed out.
      await update({
        tokenVersion: result.data?.tokenVersion,
        mustChangePassword: false,
      });

      toast.success(t('passwordChanged'));
      setCurrent('');
      setNext('');
      setConfirm('');
      router.replace(forced ? '/dashboard' : '/account');
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Field label={t('currentPassword')} htmlFor="current-password" error={error}>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value);
            setError(null);
          }}
          aria-invalid={Boolean(error)}
        />
      </Field>

      <PasswordFields
        idPrefix="own"
        label={t('newPassword')}
        password={next}
        confirm={confirm}
        onPasswordChange={setNext}
        onConfirmChange={setConfirm}
      />

      <Button type="submit" size="lg" className="w-full" disabled={pending || !ready}>
        <Save aria-hidden />
        <span>{pending ? tcom('saving') : t('changePassword')}</span>
      </Button>

      <p className="text-base text-muted-foreground">{t('otherDevicesNote')}</p>
    </form>
  );
}
