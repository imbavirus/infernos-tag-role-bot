import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's guilds from Discord API
    const response = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch servers');
    }

    const guilds = await response.json();

    // Filter guilds where the user has MANAGE_ROLES permission
    const managedGuilds = guilds.filter((guild: any) => {
      const permissions = BigInt(guild.permissions);
      const MANAGE_ROLES = BigInt(0x100000000);
      return (permissions & MANAGE_ROLES) === MANAGE_ROLES;
    });

    return NextResponse.json(managedGuilds);
  } catch (error) {
    console.error('Error fetching servers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 