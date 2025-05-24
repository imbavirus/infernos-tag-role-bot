import { NextResponse } from 'next/server';
import { botService } from '@/services/bot';
import crypto from 'crypto';
import { logger } from '@/utils/logger';

// Discord interaction types
interface DiscordInteraction {
  type: number;
  token: string;
  id: string;
  application_id: string;
  data?: {
    name: string;
    type: number;
    options?: Array<{
      name: string;
      type: number;
      value: string | number | boolean;
    }>;
  };
}

export async function POST(request: Request) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();
    logger.debug('Received raw body:', rawBody);
    
    const body = JSON.parse(rawBody) as DiscordInteraction;
    logger.debug('Parsed body:', body);
    
    // Verify the request is from Discord
    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    
    logger.debug('Headers:', {
      signature,
      timestamp,
      'content-type': request.headers.get('content-type'),
      'user-agent': request.headers.get('user-agent')
    });
    
    if (!signature || !timestamp) {
      logger.error('Missing signature or timestamp');
      return new NextResponse('Unauthorized', { 
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // For PING type (type 1), just return PONG (type 1)
    if (body.type === 1) {
      logger.info('Received PING, sending PONG');
      return NextResponse.json({ type: 1 }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // For other types, verify the signature
    const isValid = verifyDiscordRequest(rawBody, signature, timestamp);
    logger.debug('Signature verification result:', isValid);
    
    if (!isValid) {
      logger.error('Invalid signature');
      return new NextResponse('Invalid signature', { 
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Handle different interaction types
    switch (body.type) {
      case 2: // APPLICATION_COMMAND
        logger.info('Received application command:', body.data?.name);
        return NextResponse.json({ 
          type: 4, 
          data: { 
            content: 'Command received!',
            flags: 64 // Ephemeral message
          } 
        });
      
      default:
        logger.error('Unknown interaction type:', body.type);
        return NextResponse.json({ error: 'Unknown interaction type' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error handling interaction:', error);
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
      logger.error('DISCORD_PUBLIC_KEY is not set');
      return false;
    }

    // Validate input lengths
    if (signature.length !== 128) {
      logger.error('Invalid signature length:', signature.length);
      return false;
    }

    if (publicKey.length !== 64) {
      logger.error('Invalid public key length:', publicKey.length);
      return false;
    }

    logger.debug('Verifying request with:', {
      publicKeyLength: publicKey.length,
      signatureLength: signature.length,
      timestamp,
      bodyLength: body.length
    });

    const message = timestamp + body;
    const signatureBuffer = Buffer.from(signature, 'hex');
    const messageBuffer = Buffer.from(message, 'utf8');
    const publicKeyBuffer = Buffer.from(publicKey, 'hex');

    const result = crypto.verify(
      'ed25519',
      publicKeyBuffer,
      signatureBuffer,
      messageBuffer
    );

    logger.debug('Verification result:', result);
    return result;
  } catch (error) {
    logger.error('Error verifying Discord request:', error);
    return false;
  }
} 