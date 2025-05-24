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

// Cache for guild data
const guildCache = new Map<string, {
  data: any;
  timestamp: number;
}>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
  hasTagsFeature?: boolean;
}

/**
 * Fetches user's guilds from Discord API with caching
 * @param {string} accessToken - User's access token
 * @returns {Promise<Guild[]>} Array of guilds
 */
async function fetchUserGuilds(accessToken: string): Promise<Guild[]> {
  const cacheKey = `guilds_${accessToken}`;
  const cached = guildCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const response = await fetch('https://discord.com/api/users/@me/guilds', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchUserGuilds(accessToken);
    }
    throw new Error(`Failed to fetch servers: ${response.status} ${response.statusText}`);
  }

  const guilds = await response.json() as Guild[];
  guildCache.set(cacheKey, {
    data: guilds,
    timestamp: Date.now()
  });

  return guilds;
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
          setTimeout(() => reject(new Error('Bot initialization timed out. Please try again in a few moments.')), 15000)
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

    // Fetch user's guilds with caching
    const guilds = await fetchUserGuilds(accessToken);

    // Filter guilds where the user has ADMINISTRATOR permission and bot is present
    const managedGuilds = guilds.filter((guild: Guild) => {
      const permissions = BigInt(guild.permissions);
      const ADMINISTRATOR = BigInt(0x8);
      const isAdmin = (permissions & ADMINISTRATOR) === ADMINISTRATOR;
      const hasBot = botGuildIds.has(guild.id);
      
      // Add bot presence info to the guild object
      guild.hasBot = hasBot;
      
      // Add hasTagsFeature property
      guild.hasTagsFeature = guild.features?.includes('GUILD_TAGS') || false;
      
      return isAdmin;
    });

    return NextResponse.json(managedGuilds);
  } catch (error) {
    console.error('Error fetching servers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch servers' },
      { status: 500 }
    );
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