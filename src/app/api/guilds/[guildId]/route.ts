import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { guildId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const awaitedParams = await Promise.resolve(params);
    const guildId = awaitedParams.guildId;

    // Fetch guild configuration
    const config = await prisma.guildConfig.findUnique({
      where: { guildId }
    });

    if (!config) {
      return NextResponse.json(null);
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching guild configuration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { guildId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const awaitedParams = await Promise.resolve(params);
    const guildId = awaitedParams.guildId;
    const body = await request.json();
    const { representorsRoleId, logChannelId } = body;

    // Update or create guild configuration
    const config = await prisma.guildConfig.upsert({
      where: { guildId },
      update: {
        representorsRoleId,
        logChannelId
      },
      create: {
        guildId,
        representorsRoleId,
        logChannelId
      }
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating guild configuration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 