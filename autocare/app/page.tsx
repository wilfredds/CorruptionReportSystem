import { redirect } from 'next/navigation';

/** `/` always resolves to the dashboard; middleware sends guests to /login. */
export default function RootPage() {
  redirect('/dashboard');
}
