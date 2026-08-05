import { handlers } from '@/auth';

export const { GET, POST } = handlers;

// bcrypt and Prisma both need the Node runtime.
export const runtime = 'nodejs';
