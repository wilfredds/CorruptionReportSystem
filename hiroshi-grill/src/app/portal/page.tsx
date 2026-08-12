import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Staff portal",
  /* Keep the staff entrance out of search results. This is a courtesy, not a
     security control — the real protection is the login plus Row Level
     Security. Never treat "hard to find" as "protected". */
  robots: { index: false, follow: false },
};

/**
 * Placeholder so the footer link does not 404 during review. The real Supabase
 * Auth sign-in replaces this in milestone 4.
 */
export default function PortalPage() {
  return (
    <main className="flex grow items-center justify-center px-5 py-24">
      <div className="w-full max-w-md rounded-2xl border border-paper-edge bg-paper-warm/70 p-8 text-center">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-lacquer">
          Staff only
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-sumi">Portal sign-in</h1>
        <p className="mt-4 text-sm leading-relaxed text-sumi-muted">
          Staff sign-in arrives in milestone 4, once Supabase Auth is wired up. Accounts are
          created by the owner — there is no self-signup, by design.
        </p>
        <Link
          href="/"
          className="mt-7 inline-block rounded-full border border-sumi/20 px-5 py-2.5 text-sm font-semibold text-sumi transition-colors hover:border-lacquer hover:text-lacquer"
        >
          Back to the site
        </Link>
      </div>
    </main>
  );
}
