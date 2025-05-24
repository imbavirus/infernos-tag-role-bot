'use client';

import React from 'react';
import { signIn } from 'next-auth/react';
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

  // Validate client ID format
  if (!/^\d+$/.test(NEXT_PUBLIC_DISCORD_CLIENT_ID)) {
    console.error('Invalid Discord Client ID format');
    return null;
  }

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      console.log('Guild ID:', guildId); // Debug log

      // Pass the parameters through signIn
      await signIn('discord', {
        callbackUrl: `/dashboard${guildId ? `?guild_id=${guildId}` : ''}`,
        redirect: true,
        scope: 'identify email guilds bot applications.commands',
        permissions: '2415922176',
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code'
      }, guildId ? { guild_id: guildId } : undefined);
    } catch (error) {
      console.error('Error initiating OAuth flow:', error);
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={`inline-flex items-center rounded-xl bg-gradient-to-r from-lime to-lime-dark hover:from-lime-light hover:to-lime transition-all duration-300 font-semibold shadow-lg shadow-lime/25 hover:shadow-lime/40 hover:scale-105 ${sizeClasses[size]} ${className}`}
    >
      <FaDiscord className="mr-3 text-xl" />
      Add to Discord
    </button>
  );
} 