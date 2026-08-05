import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { verifyCredentials } from './lib/auth-logic';
import { loginSchema } from './lib/validation';
import { prisma } from './lib/prisma';

/**
 * The Node-runtime Auth.js instance: `authConfig` plus the Credentials
 * provider.
 *
 * `authorize` is deliberately read-only. Counting failed attempts, locking the
 * account and writing audit rows all happen in the login server action
 * (app/(auth)/login/actions.ts) so that one attempt is never counted twice.
 * The checks here still stand on their own, so a request posted straight at
 * /api/auth/callback/credentials cannot bypass the lockout or sign in to a
 * disabled account.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const result = await verifyCredentials(parsed.data.username, parsed.data.password);
        if (!result.ok) return null;

        const policy = await prisma.user.findUnique({
          where: { id: result.user.id },
          select: { policyAcceptedAt: true },
        });

        return {
          id: result.user.id,
          name: result.user.name,
          username: result.user.username,
          role: result.user.role,
          locale: result.user.locale,
          policyAccepted: Boolean(policy?.policyAcceptedAt),
        };
      },
    }),
  ],
});
