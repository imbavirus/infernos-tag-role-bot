import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { botService } from '@/services/bot';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Wait for bot to be ready
    let retries = 0;
    while (!botService.isLoggedIn() && retries < 5) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries++;
    }

    if (!botService.isLoggedIn()) {
      console.log('Bot not ready after retries');
      return NextResponse.json({ error: 'Bot is not ready' }, { status: 503 });
    }

    const guilds = botService.getGuilds();
    if (guilds.length === 0) {
      console.log('No guilds found');
      return NextResponse.json({ guilds: [] });
    }

    // Filter guilds to only include those with GUILD_TAGS feature
    const guildsWithTags = guilds.filter(guild => 
      // @ts-ignore - features is a string array but TypeScript doesn't know about GUILD_TAGS
      guild.features.includes('GUILD_TAGS')
    );

    const formattedGuilds = guildsWithTags.map(guild => ({
      id: guild.id,
      name: guild.name
    }));

    return NextResponse.json({ guilds: formattedGuilds });
  } catch (error) {
    console.error('Error fetching guilds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guilds' },
      { status: 500 }
    );
  }
} 