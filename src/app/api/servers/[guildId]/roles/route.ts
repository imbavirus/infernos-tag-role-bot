import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { guildId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch roles from Discord API
    const response = await fetch(`https://discord.com/api/guilds/${params.guildId}/roles`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch roles');
    }

    const roles = await response.json();

    // Sort roles by position (highest first)
    const sortedRoles = roles.sort((a: any, b: any) => b.position - a.position);

    return NextResponse.json(sortedRoles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 