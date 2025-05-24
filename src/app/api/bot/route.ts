/**
 * @file route.ts
 * @description Bot API route for managing bot operations
 * @module app/api/bot/route
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { botService } from '@/services/bot';

// Force this route to be server-side only
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET handler for bot API route
 * @async
 * @function GET
 * @returns {Promise<NextResponse>} Bot status response
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isLoggedIn = botService.isLoggedIn();
    const guilds = botService.getGuilds();

    return NextResponse.json({
      isRunning: isLoggedIn,
      guilds: guilds.map(guild => ({
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount
      }))
    });
  } catch (error) {
    console.error('Error getting bot status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for bot API route
 * @async
 * @function POST
 * @returns {Promise<NextResponse>} Bot operation response
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isLoggedIn = botService.isLoggedIn();
    if (isLoggedIn) {
      // Since there's no stop method, we'll just return an error
      return NextResponse.json(
        { error: 'Bot stop functionality not implemented' },
        { status: 501 }
      );
    } else {
      await botService.start();
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error toggling bot status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 