import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'ADMIN' | 'STAFF';
      username: string;
      locale: string;
      policyAccepted: boolean;
      tokenVersion: number;
      mustChangePassword: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    role?: 'ADMIN' | 'STAFF';
    username?: string;
    locale?: string;
    policyAccepted?: boolean;
    tokenVersion?: number;
    mustChangePassword?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'ADMIN' | 'STAFF';
    username?: string;
    locale?: string;
    policyAccepted?: boolean;
    tokenVersion?: number;
    mustChangePassword?: boolean;
  }
}

export {};
