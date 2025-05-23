import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const guilds = await prisma.guildConfig.findMany();
    return NextResponse.json(guilds);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch guilds' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guildId, representorsRoleId, logChannelId } = body;

    const guild = await prisma.guildConfig.upsert({
      where: { guildId },
      update: {
        representorsRoleId,
        logChannelId,
      },
      create: {
        guildId,
        representorsRoleId,
        logChannelId,
      },
    });

    return NextResponse.json(guild);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update guild' }, { status: 500 });
  }
} 