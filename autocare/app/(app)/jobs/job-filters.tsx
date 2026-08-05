'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUSES = ['PAID', 'UNPAID', 'PARTIAL'] as const;

/** Search and filter the jobs list. Every control is 64px tall. */
export function JobFilters() {
  const t = useTranslations('jobs');
  const tj = useTranslations('job');
  const tcom = useTranslations('common');
  const router = useRouter();
  const params = useSearchParams();

  const [q, setQ] = React.useState(params.get('q') ?? '');
  const [status, setStatus] = React.useState(params.get('status') ?? 'all');
  const [from, setFrom] = React.useState(params.get('from') ?? '');
  const [to, setTo] = React.useState(params.get('to') ?? '');

  function apply(event?: React.FormEvent) {
    event?.preventDefault();
    const sp = new URLSearchParams();
    if (q.trim()) sp.set('q', q.trim());
    if (status !== 'all') sp.set('status', status);
    if (from) sp.set('from', from);
    if (to) sp.set('to', to);
    router.push(`/jobs${sp.toString() ? `?${sp.toString()}` : ''}`);
  }

  function clear() {
    setQ('');
    setStatus('all');
    setFrom('');
    setTo('');
    router.push('/jobs');
  }

  const hasFilters = Boolean(q || status !== 'all' || from || to);

  return (
    <form
      onSubmit={apply}
      className="space-y-5 rounded-xl border-2 border-border bg-muted/30 p-5"
    >
      <Field label={tcom('search')} htmlFor="job-search">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="job-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="pl-14"
          />
        </div>
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label={t('filterStatus')} htmlFor="job-status">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="job-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tcom('all')}</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {tj(`status_${s}` as never)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={t('filterFrom')} htmlFor="job-from">
          <Input id="job-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>

        <Field label={t('filterTo')} htmlFor="job-to">
          <Input id="job-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" size="default" className="sm:flex-1">
          <Search aria-hidden />
          <span>{tcom('apply')}</span>
        </Button>
        {hasFilters ? (
          <Button type="button" variant="outline" size="default" onClick={clear}>
            <X aria-hidden />
            <span>{tcom('clear')}</span>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
