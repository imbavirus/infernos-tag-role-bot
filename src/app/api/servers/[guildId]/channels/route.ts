/**
 * @file route.ts
 * @description Channels API route for managing Discord channels
 * @module app/api/servers/[guildId]/channels/route
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { botService } from '@/services/bot';
import { ensureBotStarted } from '@/lib/server-init';

/**
 * Interface for Discord channel data
 * @interface Channel
 * @property {string} id - Channel ID
 * @property {string} name - Channel name
 * @property {number} type - Channel type
 */
interface Channel {
  id: string;
  name: string;
  type: number;
}

/**
 * GET handler for channels API route
 * @async
 * @function GET
 * @param {Object} params - Route parameters
 * @param {string} params.guildId - Guild ID
 * @returns {Promise<NextResponse>} List of channels
 */
export async function GET(
  request: Request,
  { params }: { params: { guildId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure bot is started
    try {
      await ensureBotStarted();
    } catch (error) {
      console.error('Failed to start bot:', error);
      return NextResponse.json({ error: 'Bot is not ready' }, { status: 503 });
    }

    // Get guild from bot's cache
    const awaitedParams = await Promise.resolve(params);
    const guildId = awaitedParams.guildId;
    
    const guild = botService.client.guilds.cache.get(guildId);
    
    if (!guild) {
      return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
    }

    // Fetch all channels from the guild
    const channels = await guild.channels.fetch();
    
    // Convert channels to array and organize by category
    const channelsArray = Array.from(channels.values())
      .filter((channel): channel is NonNullable<typeof channel> => 
        channel !== null && (channel.type === 0 || channel.type === 4)
      )
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        parentId: channel.parentId,
        position: channel.position,
        isCategory: channel.type === 4
      }))
      .sort((a, b) => a.position - b.position);

    return NextResponse.json(channelsArray);
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 