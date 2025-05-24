/**
 * @file route.ts
 * @description NextAuth.js API route for authentication
 * @module app/api/auth/[...nextauth]/route
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 