import { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';

// Ensure required environment variables are set
const requiredEnvVars = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXT_PUBLIC_DISCORD_CLIENT_ID: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
};

// Check for missing environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}`
  );
}

const isDevelopment = process.env.NODE_ENV === 'development';

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        url: 'https://discord.com/api/oauth2/authorize',
        params: {
          scope: 'identify email guilds bot applications.commands',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          permissions: '2415922176',
          guild_id: '{guild_id}' // This will be replaced by NextAuth
        }
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.username,
          email: profile.email,
          image: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    }
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        // Handle relative URLs by combining with baseUrl
        const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
        const urlObj = new URL(fullUrl);
        const error = urlObj.searchParams.get('error');
        const guildId = urlObj.searchParams.get('guild_id');
        
        console.log('Redirect URL:', fullUrl); // Debug log
        console.log('Guild ID from URL:', guildId); // Debug log
        
        if (error) {
          console.error('OAuth error:', error);
          return `${baseUrl}/auth/error?error=${error}`;
        }

        // If we have a guild_id in the URL, use it directly
        if (guildId) {
          return `${baseUrl}/dashboard?guild_id=${guildId}`;
        }

        // Default redirect to dashboard
        return `${baseUrl}/dashboard`;
      } catch (error) {
        console.error('Error in redirect callback:', error);
        return `${baseUrl}/dashboard`;
      }
    },
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
  debug: isDevelopment,
}; 