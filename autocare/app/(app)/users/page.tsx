import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { requirePageAdmin } from '@/lib/session';
import { intlTagFor } from '@/i18n/locales';
import { formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CreateUserDialog, UserRowActions } from './user-controls';

export const metadata = { title: 'Users — AutoCare' };
export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const admin = await requirePageAdmin();
  const [t, locale] = await Promise.all([getTranslations('users'), getLocale()]);
  const tag = intlTagFor(locale);

  const users = await prisma.user.findMany({
    orderBy: [{ isActive: 'desc' }, { role: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      lockedUntil: true,
    },
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1>{t('title')}</h1>
          <p className="mt-1 text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>
        <CreateUserDialog />
      </div>

      <ul className="space-y-3">
        {users.map((user) => {
          const locked = Boolean(user.lockedUntil && user.lockedUntil > now);
          return (
            <li
              key={user.id}
              className="space-y-4 rounded-lg border-2 border-border bg-background p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold">{user.name}</p>
                  <p className="truncate text-lg text-muted-foreground">@{user.username}</p>
                  <p className="mt-1 text-base text-muted-foreground">
                    {t('lastLogin')}:{' '}
                    {user.lastLoginAt ? formatDateTime(user.lastLoginAt, tag) : t('never')}
                  </p>
                  {locked && user.lockedUntil ? (
                    <p className="mt-1 text-base font-semibold text-destructive">
                      {t('lockedUntil', { time: formatDateTime(user.lockedUntil, tag) })}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={user.role === 'ADMIN' ? 'outline' : 'muted'}>
                    {t(`role_${user.role}` as never)}
                  </Badge>
                  <Badge variant={user.isActive ? 'paid' : 'unpaid'}>
                    {user.isActive ? t('active') : t('inactive')}
                  </Badge>
                </div>
              </div>

              <UserRowActions
                user={{
                  id: user.id,
                  name: user.name,
                  isActive: user.isActive,
                  locked,
                }}
                isSelf={user.id === admin.id}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
