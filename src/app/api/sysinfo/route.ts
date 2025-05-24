/**
 * @file route.ts
 * @description System information API route for monitoring bot status
 * @module app/api/sysinfo/route
 */

import { NextResponse } from 'next/server';
import { botService } from '@/services/bot';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST handler for system information API route
 * @async
 * @function POST
 * @returns {Promise<NextResponse>} System information response containing bot status, shards, guilds, ping, uptime, and memory usage
 */
export async function POST() {
  try {
    const info = botService.getStatusInfo();
    return NextResponse.json(info);
  } catch (error) {
    console.error('Error getting system info:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 