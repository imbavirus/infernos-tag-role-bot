import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

    // Here you would verify the code and return the user's Discord ID
    // This is a placeholder - implement your verification logic
    return NextResponse.json({
      user_id: session.user.id,
      verified: true
    });
  } catch (error) {
    console.error('Error in verification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 