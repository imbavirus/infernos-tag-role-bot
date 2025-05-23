import { NextResponse } from 'next/server';
import { botService } from '@/services/bot';

export async function POST() {
  try {
    await botService.start();
    return NextResponse.json({ message: 'Bot started successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start bot' }, { status: 500 });
  }
} 