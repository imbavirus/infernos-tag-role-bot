import React from 'react';
import Link from 'next/link';
import { FaDiscord } from 'react-icons/fa';

interface AddToDiscordButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  guildId?: string;
}

export default function AddToDiscordButton({ className = '', size = 'md', guildId }: AddToDiscordButtonProps) {
  const NEXT_PUBLIC_DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  
  if (!NEXT_PUBLIC_DISCORD_CLIENT_ID) {
    console.error('Discord Client ID is not set in environment variables');
    return null;
  }

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const oauthUrl = new URL('https://discord.com/api/oauth2/authorize');
  oauthUrl.searchParams.append('client_id', NEXT_PUBLIC_DISCORD_CLIENT_ID);
  oauthUrl.searchParams.append('permissions', '2415922176');
  oauthUrl.searchParams.append('scope', 'bot applications.commands');
  if (guildId) {
    oauthUrl.searchParams.append('guild_id', guildId);
  }
  oauthUrl.searchParams.append('redirect_uri', `${window.location.origin}/api/auth/callback/discord`);
  if (guildId) {
    oauthUrl.searchParams.append('state', JSON.stringify({ guildId }));
  }

  return (
    <Link 
      href={oauthUrl.toString()}
      className={`inline-flex items-center rounded-xl bg-gradient-to-r from-lime to-lime-dark hover:from-lime-light hover:to-lime transition-all duration-300 font-semibold shadow-lg shadow-lime/25 hover:shadow-lime/40 hover:scale-105 ${sizeClasses[size]} ${className}`}
    >
      <FaDiscord className="mr-3 text-xl" />
      Add to Discord
    </Link>
  );
} 