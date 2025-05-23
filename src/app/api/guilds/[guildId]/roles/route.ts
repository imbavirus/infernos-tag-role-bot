import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { botService } from '@/services/bot';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ guildId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { guildId } = await context.params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!botService.isLoggedIn()) {
      return NextResponse.json({ error: 'Bot is not ready' }, { status: 503 });
    }

    const guild = botService.client.guilds.cache.get(guildId);
    if (!guild) {
      return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
    }

    // Fetch roles to ensure cache is up to date
    await guild.roles.fetch();

    const roles = guild.roles.cache
      .filter(role => role.name !== '@everyone')
      .sort((a, b) => b.position - a.position) // Sort by position (highest first)
      .map(role => ({
        id: role.id,
        name: role.name,
        color: role.hexColor,
      }));

    console.log(`Fetched ${roles.length} roles for guild ${guild.name}`);

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 