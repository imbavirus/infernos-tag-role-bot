import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { botService } from '@/services/bot';
import { ensureBotStarted } from '@/lib/server-init';

interface Guild {
  id: string;
  name: string;
  permissions: string;
  hasBot?: boolean;
  features?: string[];
}

export async function GET() {
  try {
    console.log('Starting server API request...');
    const session = await getServerSession(authOptions);
    console.log('Session retrieved:', !!session);

    if (!session) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure bot is started and ready
    try {
      console.log('Ensuring bot is started...');
      await Promise.race([
        ensureBotStarted(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Bot initialization timed out after 30 seconds')), 30000)
        )
      ]);
      console.log('Bot started, checking if logged in...');
      
      // Wait for bot to be ready with a timeout
      let retries = 0;
      while (!botService.isLoggedIn() && retries < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries++;
      }

      if (!botService.isLoggedIn()) {
        console.log('Bot is not logged in after retries');
        return NextResponse.json({ error: 'Bot is not ready' }, { status: 503 });
      }
      console.log('Bot is ready');
    } catch (error) {
      console.error('Failed to start bot:', error);
      return NextResponse.json({ error: 'Bot is not ready' }, { status: 503 });
    }

    // Get bot's guilds
    console.log('Getting bot guilds...');
    const botGuilds = botService.getGuilds();
    const botGuildIds = new Set(botGuilds.map(guild => guild.id));
    console.log('Bot guilds retrieved:', botGuildIds.size);

    // Fetch user's guilds from Discord API
    console.log('Fetching user guilds from Discord API...');
    const response = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('Discord API error:', response.status);
      throw new Error('Failed to fetch servers');
    }

    const guilds = await response.json() as Guild[];
    console.log('User guilds retrieved:', guilds.length);

    // Filter guilds where the user has ADMINISTRATOR permission and bot is present
    const managedGuilds = guilds.filter((guild: Guild) => {
      const permissions = BigInt(guild.permissions);
      const ADMINISTRATOR = BigInt(0x8);
      const isAdmin = (permissions & ADMINISTRATOR) === ADMINISTRATOR;
      const hasBot = botGuildIds.has(guild.id);
      
      // Add bot presence info to the guild object
      guild.hasBot = hasBot;
      
      return isAdmin;
    });

    // Add hasTagsFeature to each guild
    const guildsWithFeatures = managedGuilds.map(guild => ({
      ...guild,
      hasTagsFeature: guild.features?.includes('GUILD_TAGS') || false
    }));

    console.log('Filtered guilds:', guildsWithFeatures.length);
    return NextResponse.json(guildsWithFeatures);
  } catch (error) {
    console.error('Error in server API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 