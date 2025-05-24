/**
 * @file route.ts
 * @description Guild configuration API route for managing guild settings
 * @module app/api/guilds/route
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
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

/**
 * POST handler for guild configuration API route
 * @async
 * @function POST
 * @param {Request} request - The incoming request containing guild configuration
 * @returns {Promise<NextResponse>} Updated guild configuration
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { guildId, roleId, logChannelId } = data;

    // Validate required fields
    if (!guildId || !roleId) {
      return NextResponse.json(
        { error: 'Guild ID and Role ID are required' },
        { status: 400 }
      );
    }

    // Create or update guild configuration
    const config = await prisma.guildConfig.upsert({
      where: { guildId },
      update: {
        roleId,
        logChannelId: logChannelId || null,
      },
      create: {
        guildId,
        roleId,
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