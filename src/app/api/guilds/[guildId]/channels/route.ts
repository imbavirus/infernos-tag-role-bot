/**
 * @file route.ts
 * @description Channels API route for fetching guild channels
 * @module app/api/guilds/[guildId]/channels/route
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { botService } from '@/services/bot';
import { ensureBotStarted } from '@/lib/server-init';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET handler for channels API route
 * @async
 * @function GET
 * @param {Request} request - The incoming request
 * @param {Object} context - Route context
 * @param {Promise<{guildId: string}>} context.params - Route parameters
 * @returns {Promise<NextResponse>} List of text channels in the guild
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ guildId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { guildId } = await context.params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureBotStarted();

    const guild = botService.client.guilds.cache.get(guildId);
    if (!guild) {
      return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
    }

    const channels = guild.channels.cache
      .filter(channel => channel.type === 0) // 0 is GUILD_TEXT
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
      }));

    return NextResponse.json({ channels });
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channels', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 