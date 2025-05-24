/**
 * @file route.ts
 * @description Bot test API route for testing bot functionality
 * @module app/api/bot/test/route
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { botService } from '@/services/bot';

/**
 * POST handler for bot test API route
 * @async
 * @function POST
 * @returns {Promise<NextResponse>} Test response
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isLoggedIn = botService.isLoggedIn();
    const guilds = botService.getGuilds();

    return NextResponse.json({
      success: true,
      isLoggedIn,
      guilds: guilds.map(guild => ({
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount
      }))
    });
  } catch (error) {
    console.error('Error testing bot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 