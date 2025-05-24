import { NextResponse } from 'next/server';
import tweetnacl from 'tweetnacl';

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
    
    // Verify the request is from Discord
    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    
    if (!signature || !timestamp) {
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
      const isValid = verifyDiscordRequest(rawBody, signature, timestamp);

      if (!isValid) {
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
      const body = JSON.parse(rawBody) as DiscordInteraction;
      
      // For PING type (type 1), just return PONG (type 1)
      if (body.type === 1) {
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
      switch (body.type) {
        case 2: // APPLICATION_COMMAND
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
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
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
      return false;
    }

    // Validate input lengths
    if (signature.length !== 128) {
      return false;
    }

    if (publicKey.length !== 64) {
      return false;
    }

    const message = timestamp + body;
    const messageBuffer = Buffer.from(message, 'utf8');
    const signatureBuffer = Buffer.from(signature, 'hex');
    const publicKeyBuffer = Buffer.from(publicKey, 'hex');

    try {
      // Convert buffers to Uint8Arrays for tweetnacl
      const messageUint8 = new Uint8Array(messageBuffer);
      const signatureUint8 = new Uint8Array(signatureBuffer);
      const publicKeyUint8 = new Uint8Array(publicKeyBuffer);

      // Use the low-level API to verify the signature
      // @ts-ignore - tweetnacl types are incorrect
      return tweetnacl.sign.detached.verify(
        messageUint8,
        signatureUint8,
        publicKeyUint8
      );
    } catch (verifyError) {
      return false;
    }
  } catch (error) {
    return false;
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Signature-Ed25519, X-Signature-Timestamp'
    }
  });
} 