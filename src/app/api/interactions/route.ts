import { NextResponse } from 'next/server';
import { botService } from '@/services/bot';
import tweetnacl from 'tweetnacl';
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
  logger.debug('=== Starting Discord Interaction Request ===');
  logger.debug('Request headers:', {
    'x-signature-ed25519': request.headers.get('x-signature-ed25519'),
    'x-signature-timestamp': request.headers.get('x-signature-timestamp'),
    'content-type': request.headers.get('content-type'),
    'user-agent': request.headers.get('user-agent'),
    'host': request.headers.get('host'),
    'origin': request.headers.get('origin')
  });

  // Debug environment variables
  logger.debug('Environment variables:', {
    hasPublicKey: !!process.env.DISCORD_PUBLIC_KEY,
    publicKeyLength: process.env.DISCORD_PUBLIC_KEY?.length,
    publicKeyPreview: process.env.DISCORD_PUBLIC_KEY ? 
      `${process.env.DISCORD_PUBLIC_KEY.substring(0, 10)}...${process.env.DISCORD_PUBLIC_KEY.substring(process.env.DISCORD_PUBLIC_KEY.length - 10)}` : 
      'not set',
    nodeEnv: process.env.NODE_ENV,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL
  });

  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();
    logger.debug('Raw request body:', {
      length: rawBody.length,
      content: rawBody,
      isJson: isJsonString(rawBody)
    });
    
    // Verify the request is from Discord
    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    
    logger.debug('Verification headers:', {
      hasSignature: !!signature,
      signatureLength: signature?.length,
      hasTimestamp: !!timestamp,
      timestampValue: timestamp
    });
    
    if (!signature || !timestamp) {
      logger.error('Missing required headers:', { 
        signature: !!signature, 
        timestamp: !!timestamp,
        allHeaders: Object.fromEntries(request.headers.entries())
      });
      return new NextResponse(
        JSON.stringify({ error: 'Missing required headers' }), 
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // For PING type (type 1), verify signature and return PONG
    try {
      logger.debug('Starting signature verification...');
      const isValid = verifyDiscordRequest(rawBody, signature, timestamp);
      logger.debug('Signature verification result:', { isValid });

      if (!isValid) {
        logger.error('Invalid signature', {
          signature,
          timestamp,
          bodyLength: rawBody.length
        });
        return new NextResponse(
          JSON.stringify({ error: 'Invalid signature' }), 
          { 
            status: 401,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Parse body after verification
      logger.debug('Parsing request body...');
      const body = JSON.parse(rawBody) as DiscordInteraction;
      logger.debug('Parsed body:', {
        type: body.type,
        id: body.id,
        application_id: body.application_id,
        hasData: !!body.data,
        dataName: body.data?.name
      });
      
      // For PING type (type 1), just return PONG (type 1)
      if (body.type === 1) {
        logger.info('Received PING, sending PONG');
        return new NextResponse(
          JSON.stringify({ type: 1 }), 
          { 
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Handle other interaction types
      logger.debug('Handling interaction type:', body.type);
      switch (body.type) {
        case 2: // APPLICATION_COMMAND
          logger.info('Received application command:', body.data?.name);
          return new NextResponse(
            JSON.stringify({ 
              type: 4, 
              data: { 
                content: 'Command received!',
                flags: 64 // Ephemeral message
              } 
            }), 
            { 
              status: 200,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
        
        default:
          logger.error('Unknown interaction type:', {
            type: body.type,
            body: body
          });
          return new NextResponse(
            JSON.stringify({ error: 'Unknown interaction type' }), 
            { 
              status: 400,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
      }
    } catch (error) {
      logger.error('Error processing interaction:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name
      });
      return new NextResponse(
        JSON.stringify({ error: 'Invalid request' }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  } catch (error) {
    logger.error('Error handling interaction:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name
    });
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } finally {
    logger.debug('=== Completed Discord Interaction Request ===');
  }
}

function verifyDiscordRequest(
  body: string,
  signature: string,
  timestamp: string
): boolean {
  logger.debug('=== Starting Discord Request Verification ===');
  try {
    const publicKey = process.env.DISCORD_PUBLIC_KEY;
    logger.debug('Public key check:', {
      exists: !!publicKey,
      length: publicKey?.length,
      preview: publicKey ? 
        `${publicKey.substring(0, 10)}...${publicKey.substring(publicKey.length - 10)}` : 
        'not set'
    });

    if (!publicKey) {
      logger.error('DISCORD_PUBLIC_KEY is not set');
      return false;
    }

    // Log the verification inputs
    logger.debug('Verification inputs:', {
      publicKeyLength: publicKey.length,
      signatureLength: signature.length,
      timestamp,
      bodyLength: body.length,
      bodyPreview: body.substring(0, 100) + '...'
    });

    // Validate input lengths
    if (signature.length !== 128) {
      logger.error('Invalid signature length:', {
        length: signature.length,
        expected: 128,
        signature
      });
      return false;
    }

    if (publicKey.length !== 64) {
      logger.error('Invalid public key length:', {
        length: publicKey.length,
        expected: 64,
        publicKey
      });
      return false;
    }

    const message = timestamp + body;
    const messageBuffer = Buffer.from(message, 'utf8');
    const signatureBuffer = Buffer.from(signature, 'hex');
    const publicKeyBuffer = Buffer.from(publicKey, 'hex');

    // Log the buffers for debugging
    logger.debug('Verification buffers:', {
      messageLength: messageBuffer.length,
      messagePreview: messageBuffer.toString('utf8').substring(0, 100) + '...',
      signatureLength: signatureBuffer.length,
      signatureHex: signatureBuffer.toString('hex'),
      publicKeyLength: publicKeyBuffer.length,
      publicKeyHex: publicKeyBuffer.toString('hex')
    });

    try {
      logger.debug('Attempting nacl verification...');
      // Convert buffers to Uint8Arrays for tweetnacl
      const messageUint8 = new Uint8Array(messageBuffer);
      const signatureUint8 = new Uint8Array(signatureBuffer);
      const publicKeyUint8 = new Uint8Array(publicKeyBuffer);

      logger.debug('Converted to Uint8Arrays:', {
        messageLength: messageUint8.length,
        signatureLength: signatureUint8.length,
        publicKeyLength: publicKeyUint8.length
      });

      // Use the low-level API to verify the signature
      // @ts-ignore - tweetnacl types are incorrect
      const isVerified = tweetnacl.sign.detached.verify(
        messageUint8,
        signatureUint8,
        publicKeyUint8
      );

      logger.debug('Nacl verification result:', { isVerified });
      return isVerified;
    } catch (verifyError) {
      logger.error('Nacl verification error:', {
        error: verifyError instanceof Error ? verifyError.message : 'Unknown error',
        stack: verifyError instanceof Error ? verifyError.stack : undefined,
        errorType: verifyError?.constructor?.name
      });
      return false;
    }
  } catch (error) {
    logger.error('Error verifying Discord request:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name
    });
    return false;
  } finally {
    logger.debug('=== Completed Discord Request Verification ===');
  }
}

// Helper function to check if a string is valid JSON
function isJsonString(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS(request: Request) {
  logger.debug('Handling OPTIONS request');
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Signature-Ed25519, X-Signature-Timestamp'
    }
  });
} 