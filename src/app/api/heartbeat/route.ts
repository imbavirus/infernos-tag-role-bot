import { NextResponse } from 'next/server';
import { botService } from '@/services/bot';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    const isReady = botService.isLoggedIn();
    return NextResponse.json({ status: isReady ? 'ok' : 'not_ready' });
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
} 