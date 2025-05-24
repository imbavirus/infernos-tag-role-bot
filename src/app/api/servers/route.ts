/**
 * @file route.ts
 * @description API route handlers for Discord server management
 * @module app/api/servers/route
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { botService } from '@/services/bot';
import { ensureBotStarted } from '@/lib/server-init';
import { Session } from 'next-auth';

/**
 * Represents a Discord guild (server)
 * @interface Guild
 * @property {string} id - The unique identifier of the guild
 * @property {string} name - The name of the guild
 * @property {string} permissions - The permissions string for the bot in this guild
 * @property {boolean} [hasBot] - Whether the bot is present in this guild
 * @property {string[]} [features] - Array of guild features
 */
interface Guild {
  id: string;
  name: string;
  permissions: string;
  hasBot?: boolean;
  features?: string[];
}

/**
 * GET handler for fetching user's Discord servers
 * @route GET /api/servers
 * @returns {Promise<NextResponse>} JSON response containing user's servers
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get access token from session
    const accessToken = (session as any).user?.accessToken;
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    // Ensure bot is started and ready with better error handling
    try {
      await Promise.race([
        ensureBotStarted(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Bot initialization timed out')), 10000)
        )
      ]);
      
      // Wait for bot to be ready with exponential backoff
      let retries = 0;
      const maxRetries = 3;
      const baseDelay = 500;

      while (!botService.isLoggedIn() && retries < maxRetries) {
        const delay = baseDelay * Math.pow(2, retries);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      }

      if (!botService.isLoggedIn()) {
        return NextResponse.json({ 
          error: 'Bot is not ready',
          details: 'The bot is taking longer than expected to start. Please try again in a few moments.'
        }, { status: 503 });
      }
    } catch (error) {
      console.error('Failed to start bot:', error);
      return NextResponse.json({ 
        error: 'Bot is not ready',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 503 });
    }

    // Get bot's guilds
    const botGuilds = botService.getGuilds();
    const botGuildIds = new Set(botGuilds.map(guild => guild.id));

    // Fetch user's guilds from Discord API with retry logic
    let retries = 0;
    const maxRetries = 3;
    let lastError;

    while (retries < maxRetries) {
      try {
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Discord API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          
          if (response.status === 401) {
            return NextResponse.json({ error: 'Unauthorized - Please sign in again' }, { status: 401 });
          }
          
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
            await new Promise(resolve => setTimeout(resolve, delay));
            retries++;
            continue;
          }
          
          throw new Error(`Failed to fetch servers: ${response.status} ${response.statusText}`);
        }

        const guilds = await response.json() as Guild[];

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

        return NextResponse.json(guildsWithFeatures);
      } catch (error) {
        lastError = error;
        retries++;
        if (retries < maxRetries) {
          const delay = 1000 * Math.pow(2, retries);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Failed to fetch servers after multiple retries');
  } catch (error) {
    console.error('Error in server API:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST handler for adding the bot to a Discord server
 * @route POST /api/servers
 * @returns {Promise<NextResponse>} JSON response indicating success or failure
 */
export async function POST(request: Request) {
  // Implementation of POST handler
} 