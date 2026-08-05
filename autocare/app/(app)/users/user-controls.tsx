'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { UserPlus, Save, KeyRound, Power, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PasswordFields, passwordReady } from '@/components/forms/password-fields';
import { createUserAction, setUserActiveAction, resetPasswordAction, unlockUserAction } from './actions';

/** Create a STAFF account. */
export function CreateUserDialog() {
  const t = useTranslations('users');
  const tcom = useTranslations('common');
  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const ready = name.trim() && username.trim().length >= 3 && passwordReady(password, confirm);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;
    startTransition(async () => {
      const result = await createUserAction({
        name: name.trim(),
        username: username.trim(),
        password,
        role: 'STAFF',
      });
      if (!result.ok) {
        toast.error(
          result.messageKey === 'users.usernameTaken' ? t('usernameTaken') : tcom('unknownError'),
        );
        return;
      }
      toast.success(t('created'));
      setOpen(false);
      setName('');
      setUsername('');
      setPassword('');
      setConfirm('');
      router.refresh();
    });
  }

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        <UserPlus aria-hidden />
        <span>{t('add')}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent closeLabel={tcom('close')}>
          <DialogHeader>
            <DialogTitle>{t('addTitle')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-5">
            <Field label={t('name')} htmlFor="nu-name">
              <Input
                id="nu-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </Field>

            <Field label={t('username')} htmlFor="nu-username">
              <Input
                id="nu-username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </Field>

            <PasswordFields
              idPrefix="nu"
              password={password}
              confirm={confirm}
              onPasswordChange={setPassword}
              onConfirmChange={setConfirm}
            />

            <DialogFooter>
              <Button type="submit" size="lg" disabled={pending || !ready} className="sm:flex-1">
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

/** Turn on/off, unlock, and reset the password for one account. */
export function UserRowActions({
  user,
  isSelf,
}: {
  user: { id: string; name: string; isActive: boolean; locked: boolean };
  isSelf: boolean;
}) {
  const t = useTranslations('users');
  const tcom = useTranslations('common');
  const router = useRouter();

  const [resetOpen, setResetOpen] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  function toggleActive() {
    startTransition(async () => {
      const result = await setUserActiveAction(user.id, !user.isActive);
      if (!result.ok) {
        toast.error(
          result.messageKey === 'users.cannotDeactivateSelf'
            ? t('cannotDeactivateSelf')
            : tcom('unknownError'),
        );
        return;
      }
      toast.success(user.isActive ? t('deactivated') : t('activated'));
      router.refresh();
    });
  }

  function unlock() {
    startTransition(async () => {
      const result = await unlockUserAction(user.id);
      if (!result.ok) {
        toast.error(tcom('unknownError'));
        return;
      }
      toast.success(t('unlocked'));
      router.refresh();
    });
  }

  function resetPassword(event: React.FormEvent) {
    event.preventDefault();
    if (!passwordReady(password, confirm)) return;
    startTransition(async () => {
      const result = await resetPasswordAction({ userId: user.id, password });
      if (!result.ok) {
        toast.error(tcom('unknownError'));
        return;
      }
      toast.success(t('passwordReset'));
      setResetOpen(false);
      setPassword('');
      setConfirm('');
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="compact" onClick={() => setResetOpen(true)}>
        <KeyRound aria-hidden />
        <span>{t('resetPassword')}</span>
      </Button>

      {user.locked ? (
        <Button variant="outline" size="compact" onClick={unlock} disabled={pending}>
          <Unlock aria-hidden />
          <span>{t('unlock')}</span>
        </Button>
      ) : null}

      {/* Deactivating yourself is refused server-side too. */}
      {!isSelf ? (
        <Button variant="outline" size="compact" onClick={toggleActive} disabled={pending}>
          <Power aria-hidden />
          <span>{user.isActive ? t('deactivate') : t('activate')}</span>
        </Button>
      ) : null}

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent closeLabel={tcom('close')}>
          <DialogHeader>
            <DialogTitle>{t('resetPasswordTitle', { name: user.name })}</DialogTitle>
          </DialogHeader>

          <form onSubmit={resetPassword} className="space-y-5">
            <PasswordFields
              idPrefix={`rp-${user.id}`}
              label={t('newPassword')}
              password={password}
              confirm={confirm}
              onPasswordChange={setPassword}
              onConfirmChange={setConfirm}
            />

            <DialogFooter>
              <Button
                type="submit"
                size="lg"
                className="sm:flex-1"
                disabled={pending || !passwordReady(password, confirm)}
              >
                <Save aria-hidden />
                <span>{pending ? tcom('saving') : tcom('save')}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setResetOpen(false)}
                disabled={pending}
              >
                <span>{tcom('cancel')}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
