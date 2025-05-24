import { NextResponse } from 'next/server';
import { botService } from '@/services/bot';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Verify the request is from Discord
    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    
    if (!signature || !timestamp) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Handle different interaction types
    switch (body.type) {
      case 1: // PING
        return NextResponse.json({ type: 1 });
      
      case 2: // APPLICATION_COMMAND
        // Handle slash commands here
        return NextResponse.json({ type: 4, data: { content: 'Command received!' } });
      
      default:
        return NextResponse.json({ error: 'Unknown interaction type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 