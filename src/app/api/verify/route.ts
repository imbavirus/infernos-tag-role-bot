import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { botService } from '@/services/bot';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the verification code from the query parameters
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return new NextResponse('Missing verification code', { status: 400 });
    }

    // Verify the code with Discord
    try {
      const response = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
          client_secret: process.env.DISCORD_CLIENT_SECRET!,
          grant_type: 'authorization_code',
          code,
          redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify`,
        }),
      });

      if (!response.ok) {
        console.error('Discord verification failed:', await response.text());
        return new NextResponse('Verification failed', { status: 400 });
      }

      const data = await response.json();
      
      // Return the user's Discord ID and verification status
      return NextResponse.json({
        user_id: session.user.id,
        verified: true,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
      });
    } catch (error) {
      console.error('Error verifying with Discord:', error);
      return new NextResponse('Verification failed', { status: 500 });
    }
  } catch (error) {
    console.error('Error in verification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 