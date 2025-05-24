/**
 * @file auth.ts
 * @description NextAuth.js configuration and authentication setup
 * @module lib/auth
 */

import { NextAuthOptions, DefaultSession } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { JWT } from 'next-auth/jwt';

// Extend the Session type to include our custom fields
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      accessToken?: string | undefined;
    } & DefaultSession['user'];
    error?: string;
  }
}

// Extend the JWT type to include our custom fields
declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string | undefined;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  }
}

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

/**
 * NextAuth.js configuration options
 * @type {NextAuthOptions}
 */
export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        url: 'https://discord.com/api/oauth2/authorize',
        params: {
          scope: 'identify email guilds',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      },
      token: 'https://discord.com/api/oauth2/token',
      userinfo: 'https://discord.com/api/users/@me',
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
        secure: !isDevelopment
      }
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: !isDevelopment
      }
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: !isDevelopment
      }
    }
  },
  callbacks: {
    /**
     * JWT callback to add custom claims to the token
     * @param {Object} params - Callback parameters
     * @param {Object} params.token - The JWT token
     * @param {Object} params.account - The OAuth account
     * @param {Object} params.profile - The user profile
     * @returns {Promise<Object>} The modified token
     */
    async jwt({ token, account, profile }) {
      // Initial sign in
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.scope = account.scope;
        return token;
      }

      // Return previous token if the access token has not expired yet
      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }

      // Access token has expired, try to refresh it
      try {
        const response = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
            client_secret: process.env.DISCORD_CLIENT_SECRET!,
            grant_type: 'refresh_token',
            refresh_token: token.refreshToken!,
          }),
        });

        const tokens = await response.json();

        if (!response.ok) {
          console.error('Token refresh failed:', tokens);
          return { ...token, error: 'RefreshAccessTokenError' };
        }

        return {
          ...token,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? token.refreshToken,
          expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
          scope: tokens.scope,
          error: undefined,
        };
      } catch (error) {
        console.error('Error refreshing access token:', error);
        return { ...token, error: 'RefreshAccessTokenError' };
      }
    },
    /**
     * Session callback to add custom data to the session
     * @param {Object} params - Callback parameters
     * @param {Object} params.session - The session object
     * @param {Object} params.token - The JWT token
     * @returns {Promise<Object>} The modified session
     */
    async session({ session, token }) {
      if (token.error === 'RefreshAccessTokenError') {
        return {
          ...session,
          error: 'RefreshAccessTokenError',
          user: {
            ...session.user,
            accessToken: undefined
          }
        };
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          accessToken: token.accessToken,
        },
        error: token.error,
      };
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
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: isDevelopment,
}; 