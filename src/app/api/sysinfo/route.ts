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
    const client = botService.client;
    const info = {
      status: client.isReady() ? 'ready' : 'not_ready',
      shards: client.shard?.count || 1,
      guilds: client.guilds.cache.size,
      ping: client.ws.ping,
      uptime: client.uptime,
      memory: process.memoryUsage(),
    };

    return NextResponse.json(info);
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
} 