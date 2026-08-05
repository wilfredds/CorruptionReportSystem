import { getTranslations, getLocale } from 'next-intl/server';
import { Wrench } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requirePageUser } from '@/lib/session';
import { can } from '@/lib/rbac';
import { formatPeso } from '@/lib/calc';
import { intlTagFor } from '@/i18n/locales';
import { decimalToNumber } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/misc';
import { ServiceFormDialog, ServiceRowActions } from './service-controls';

export const metadata = { title: 'Services — AutoCare' };
export const dynamic = 'force-dynamic';

/**
 * The service catalog.
 *
 * ADMIN gets full CRUD. STAFF may look (the role table grants "view service
 * catalog") but sees no edit controls — and the server actions refuse them
 * regardless of what the browser sends.
 */
export default async function ServicesPage() {
  const user = await requirePageUser();
  const [t, locale] = await Promise.all([getTranslations('services'), getLocale()]);
  const tag = intlTagFor(locale);

  const services = await prisma.service.findMany({ orderBy: [{ isActive: 'desc' }, { name: 'asc' }] });
  const editable = can.manageServices(user.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1>{t('title')}</h1>
          <p className="mt-1 text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>
        {editable ? <ServiceFormDialog /> : null}
      </div>

      {!editable ? (
        <p className="rounded-lg border-2 border-border bg-muted/40 p-4 text-lg text-muted-foreground">
          {t('readOnlyNote')}
        </p>
      ) : null}

      {services.length === 0 ? (
        <EmptyState title={t('empty')} icon={<Wrench className="size-12" />} />
      ) : (
        <ul className="space-y-3">
          {services.map((service) => (
            <li
              key={service.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border-2 border-border bg-background p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold">{service.name}</p>
                <p className="money text-muted-foreground">
                  {formatPeso(decimalToNumber(service.defaultPrice), tag)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={service.isActive ? 'paid' : 'muted'}>
                  {service.isActive ? t('active') : t('inactive')}
                </Badge>
                {editable ? (
                  <ServiceRowActions
                    service={{
                      id: service.id,
                      name: service.name,
                      defaultPrice: decimalToNumber(service.defaultPrice).toFixed(2),
                      isActive: service.isActive,
                    }}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
