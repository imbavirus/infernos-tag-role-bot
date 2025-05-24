/**
 * @file next-auth.d.ts
 * @description Type definitions for NextAuth.js authentication
 * @module types/next-auth
 */

import 'next-auth';
import { DefaultSession } from 'next-auth';

/**
 * Extended session type for NextAuth.js
 * @interface Session
 * @extends {DefaultSession}
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      accessToken?: string | undefined;
    }
  }

  interface User {
    id: string;
  }
}

/**
 * Extended JWT type for NextAuth.js
 * @interface JWT
 */
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    accessToken?: string | undefined;
  }
} 