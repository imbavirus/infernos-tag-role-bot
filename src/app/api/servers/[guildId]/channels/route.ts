import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { botService } from '@/services/bot';
import { ensureBotStarted } from '@/lib/server-init';

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
    console.log('Fetching channels for guild:', guildId);
    
    const guild = botService.client.guilds.cache.get(guildId);
    console.log('Guild found in cache:', !!guild);
    
    if (!guild) {
      return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
    }

    // Fetch all channels from the guild
    const channels = await guild.channels.fetch();
    console.log('Raw channels data:', {
      totalChannels: channels.size,
      channelTypes: Array.from(channels.values()).map(c => c?.type)
    });
    
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

    console.log('Filtered channels array:', {
      totalFilteredChannels: channelsArray.length,
      channels: channelsArray.map(c => ({ name: c.name, type: c.type }))
    });

    return NextResponse.json(channelsArray);
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 