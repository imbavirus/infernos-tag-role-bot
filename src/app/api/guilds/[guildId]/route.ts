import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ guildId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { guildId } = await context.params;

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
  context: { params: Promise<{ guildId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { guildId } = await context.params;
    const body = await request.json();
    const { roleId, logChannelId } = body;

    // Update or create guild configuration
    const config = await prisma.guildConfig.upsert({
      where: { guildId },
      update: {
        roleId,
        logChannelId
      },
      create: {
        guildId,
        roleId,
        logChannelId
      }
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating guild configuration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 