import { NextResponse } from 'next/server';
import { botService } from '@/services/bot';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    
    // Verify the request is from Discord
    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    
    if (!signature || !timestamp) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // For PING type (type 1), just return PONG (type 1)
    if (body.type === 1) {
      return NextResponse.json({ type: 1 });
    }

    // For other types, verify the signature
    const isValid = verifyDiscordRequest(rawBody, signature, timestamp);
    
    if (!isValid) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    // Handle different interaction types
    switch (body.type) {
      case 2: // APPLICATION_COMMAND
        // Handle slash commands here
        return NextResponse.json({ 
          type: 4, 
          data: { 
            content: 'Command received!',
            flags: 64 // Ephemeral message
          } 
        });
      
      default:
        return NextResponse.json({ error: 'Unknown interaction type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function verifyDiscordRequest(
  body: string,
  signature: string,
  timestamp: string
): boolean {
  try {
    const publicKey = process.env.DISCORD_PUBLIC_KEY;
    if (!publicKey) {
      console.error('DISCORD_PUBLIC_KEY is not set');
      return false;
    }

    const message = timestamp + body;
    const signatureBuffer = Buffer.from(signature, 'hex');
    const messageBuffer = Buffer.from(message, 'utf8');

    return crypto.verify(
      'ed25519',
      Buffer.from(publicKey, 'hex'),
      signatureBuffer,
      messageBuffer
    );
  } catch (error) {
    console.error('Error verifying Discord request:', error);
    return false;
  }
} 