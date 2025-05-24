/**
 * @file route.ts
 * @description Initialization API route for setting up the application
 * @module app/api/init/route
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { botService } from '@/services/bot';

// Force this route to be server-side only
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST handler for init API route
 * @async
 * @function POST
 * @returns {Promise<NextResponse>} Initialization response
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await botService.start();
    return NextResponse.json({ success: true, message: 'Application initialized successfully' });
  } catch (error) {
    console.error('Error initializing application:', error);
    return NextResponse.json(
      { error: 'Failed to initialize application' },
      { status: 500 }
    );
  }
} 