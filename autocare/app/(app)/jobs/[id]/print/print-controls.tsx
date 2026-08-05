'use client';

import Link from 'next/link';
import { Printer, ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** The only chrome on the print page — hidden by `@media print`. */
export function PrintControls({
  backHref,
  backLabel,
  printLabel,
  downloadLabel,
  downloadHref,
  fileName,
}: {
  backHref: string;
  backLabel: string;
  printLabel: string;
  downloadLabel: string;
  downloadHref: string;
  fileName: string;
}) {
  return (
    <div className="no-print mx-auto mb-6 flex max-w-3xl flex-col gap-3 px-4 sm:flex-row">
      <Button size="lg" className="sm:flex-1" onClick={() => window.print()}>
        <Printer aria-hidden />
        <span>{printLabel}</span>
      </Button>
      <Button asChild variant="secondary" size="lg" className="sm:flex-1">
        <a href={downloadHref} download={fileName}>
          <Download aria-hidden />
          <span>{downloadLabel}</span>
        </a>
      </Button>
      <Button asChild variant="outline" size="lg">
        <Link href={backHref}>
          <ArrowLeft aria-hidden />
          <span>{backLabel}</span>
        </Link>
      </Button>
    </div>
  );
}
