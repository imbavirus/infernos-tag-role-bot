/**
 * @file route.ts
 * @description Bot start API route for starting the bot
 * @module app/api/bot/start/route
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { botService } from '@/services/bot';

/**
 * POST handler for bot start API route
 * @async
 * @function POST
 * @returns {Promise<NextResponse>} Start response
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await botService.start();
    return NextResponse.json({ success: true, message: 'Bot started successfully' });
  } catch (error) {
    console.error('Error starting bot:', error);
    return NextResponse.json(
      { error: 'Failed to start bot' },
      { status: 500 }
    );
  }
} 