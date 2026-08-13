import type { Metadata } from "next";

import { signOutAction } from "../actions";
import { requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const roleSummary: Record<string, string> = {
  crew: "You can see today's bookings and mark them confirmed or seated. Contact numbers are masked, and cancelling is the host's job.",
  host: "You can see full contact numbers, edit bookings, and cancel them.",
  owner: "You can do everything the host can, plus see the daily summary.",
};

/**
 * Milestone 4 stops here: this page exists to prove the whole authentication
 * chain works end to end — cookie, verified user, profile lookup, role. The
 * reservations table and its role-aware controls are milestone 5.
 */
export default async function DashboardPage() {
  const staff = await requireStaff("/portal/dashboard");
  const { profile } = staff;

  return (
    <main className="mx-auto w-full max-w-3xl grow px-5 py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-lacquer">
            Signed in
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-sumi">
            {profile.full_name ?? staff.email ?? "Staff"}
          </h1>
          <p className="mt-2 text-sm text-sumi-muted">
            {staff.email} ·{" "}
            <span className="rounded-full bg-sumi px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-gold">
              {profile.role}
            </span>
          </p>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-full border border-sumi/20 px-5 py-2.5 text-sm font-semibold text-sumi transition-colors hover:border-lacquer hover:text-lacquer"
          >
            Sign out
          </button>
        </form>
      </div>

      <div className="mt-10 rounded-2xl border border-paper-edge bg-paper-warm/70 p-7">
        <h2 className="font-display text-xl font-semibold text-sumi">What your role can do</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-sumi-soft">{roleSummary[profile.role]}</p>
        <p className="mt-4 text-sm leading-relaxed text-sumi-muted">
          None of that is enforced by this page. It is enforced by Row Level Security in Postgres,
          which is why hiding a button and removing a permission are not the same thing here.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-paper-edge p-7">
        <h2 className="font-display text-xl font-semibold text-sumi">Bookings</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-sumi-muted">
          The reservations table and its role-aware controls arrive in milestone 5. This page
          currently exists to prove the sign-in chain works: cookie → verified user → profile →
          role.
        </p>
      </div>
    </main>
  );
}
