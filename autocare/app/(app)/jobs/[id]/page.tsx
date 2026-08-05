import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Pencil, Printer, Download, Copy, ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requirePageUser } from '@/lib/session';
import { jobInclude, serializeJob } from '@/lib/jobs';
import { getShopInfo } from '@/lib/settings';
import { Button } from '@/components/ui/button';
import { ReceiptView } from '@/components/receipt/receipt-view';
import { DeleteJobButton } from './delete-job-button';

export const dynamic = 'force-dynamic';

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser();
  const { id } = await params;

  const [job, shop, t, tcom] = await Promise.all([
    prisma.job.findUnique({ where: { id }, include: jobInclude }),
    getShopInfo(),
    getTranslations('jobs'),
    getTranslations('common'),
  ]);

  if (!job) notFound();

  const serialized = serializeJob(job);

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="compact">
            <Link href="/jobs">
              <ArrowLeft aria-hidden />
              <span>{tcom('back')}</span>
            </Link>
          </Button>
          <h1 className="mt-2">{t('detailTitle', { number: job.jobNumber })}</h1>
        </div>
      </div>

      {/* Action bar — every button carries a text label. */}
      <div className="no-print grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Button asChild size="lg">
          <a href={`/api/jobs/${job.id}/receipt`} download={`${job.jobNumber}.pdf`}>
            <Download aria-hidden />
            <span>{tcom('downloadPdf')}</span>
          </a>
        </Button>

        <Button asChild variant="secondary" size="lg">
          <Link href={`/jobs/${job.id}/print`}>
            <Printer aria-hidden />
            <span>{tcom('print')}</span>
          </Link>
        </Button>

        <Button asChild variant="outline" size="lg">
          <Link href={`/jobs/new?from=${job.id}`}>
            <Copy aria-hidden />
            <span>{(await getTranslations('job'))('duplicate')}</span>
          </Link>
        </Button>

        <Button asChild variant="outline" size="lg">
          <Link href={`/jobs/${job.id}/edit`}>
            <Pencil aria-hidden />
            <span>{tcom('edit')}</span>
          </Link>
        </Button>

        <DeleteJobButton
          jobId={job.id}
          jobNumber={job.jobNumber}
          customerName={job.customer.fullName}
        />
      </div>

      <ReceiptView job={serialized} shop={shop} />
    </div>
  );
}
