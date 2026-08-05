import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'ADMIN' | 'STAFF';
      username: string;
      locale: string;
      policyAccepted: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    role?: 'ADMIN' | 'STAFF';
    username?: string;
    locale?: string;
    policyAccepted?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'ADMIN' | 'STAFF';
    username?: string;
    locale?: string;
    policyAccepted?: boolean;
  }
}

export {};
