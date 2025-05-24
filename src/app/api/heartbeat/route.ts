/**
 * @file route.ts
 * @description Heartbeat API route for checking bot status
 * @module app/api/heartbeat/route
 */

import { NextResponse } from 'next/server';
import { botService } from '@/services/bot';
import { ensureBotStarted } from '@/lib/server-init';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST handler for heartbeat API route
 * @async
 * @function POST
 * @returns {Promise<NextResponse>} Bot status response
 */
export async function POST() {
  try {
    // Ensure bot is started
    await ensureBotStarted();
    
    const isLoggedIn = botService.isLoggedIn();
    return NextResponse.json({ status: 'success', isLoggedIn });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 