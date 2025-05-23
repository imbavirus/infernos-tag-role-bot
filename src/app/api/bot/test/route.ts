import { NextResponse } from 'next/server';
import { botService } from '@/services/bot';

export async function GET() {
  try {
    // Check if bot is logged in
    const isLoggedIn = botService.isLoggedIn();
    const guilds = botService.getGuilds();

    return NextResponse.json({
      status: 'success',
      isLoggedIn,
      guilds: guilds.map(guild => ({
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount
      }))
    });
  } catch (error) {
    console.error('Bot test error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 