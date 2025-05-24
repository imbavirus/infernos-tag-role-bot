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
    const guild = botService.client.guilds.cache.get(guildId);
    
    if (!guild) {
      return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
    }

    // Get bot's member object in the guild
    const botMember = await guild.members.fetch(botService.client.user!.id);
    if (!botMember) {
      return NextResponse.json({ error: 'Bot not found in guild' }, { status: 404 });
    }

    // Get bot's highest role position
    const botHighestRole = Math.max(...botMember.roles.cache.map(role => role.position));

    // Fetch roles from the guild
    const roles = await guild.roles.fetch();
    
    // Convert roles to array, filter out @everyone and roles above bot's highest role
    const rolesArray = Array.from(roles.values())
      .filter(role => 
        role.id !== guild.id && // Filter out @everyone
        role.position < botHighestRole && // Only include roles below bot's highest role
        !role.managed // Filter out managed roles (bot roles, etc.)
      )
      .map(role => ({
        id: role.id,
        name: role.name,
        color: role.hexColor.replace('#', ''),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

    return NextResponse.json(rolesArray);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 