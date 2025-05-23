import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configs = await prisma.guildConfig.findMany();
    return NextResponse.json(configs);
  } catch (error) {
    console.error('Error fetching guild configurations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guild configurations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { guildId, representorsRoleId, logChannelId } = data;

    // Validate required fields
    if (!guildId || !representorsRoleId) {
      return NextResponse.json(
        { error: 'Guild ID and Representors Role ID are required' },
        { status: 400 }
      );
    }

    // Create or update guild configuration
    const config = await prisma.guildConfig.upsert({
      where: { guildId },
      update: {
        representorsRoleId,
        logChannelId: logChannelId || null,
      },
      create: {
        guildId,
        representorsRoleId,
        logChannelId: logChannelId || null,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error saving guild configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save guild configuration' },
      { status: 500 }
    );
  }
} 