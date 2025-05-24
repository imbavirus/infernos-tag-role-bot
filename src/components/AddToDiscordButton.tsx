/**
 * @file AddToDiscordButton.tsx
 * @description A React component that renders a button to add the bot to a Discord server
 * @module components/AddToDiscordButton
 */

'use client';

import React from 'react';
import { signIn } from 'next-auth/react';
import { FaDiscord } from 'react-icons/fa';

/**
 * Props for the AddToDiscordButton component
 * @interface AddToDiscordButtonProps
 * @property {string} [className] - Additional CSS classes to apply to the button
 * @property {'sm' | 'md' | 'lg'} [size='md'] - Size variant of the button
 * @property {string} [guildId] - Optional Discord guild ID to pre-select the server
 */
interface AddToDiscordButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  guildId?: string;
}

/**
 * A button component that initiates the Discord OAuth flow to add the bot to a server
 * @component
 * @param {AddToDiscordButtonProps} props - Component props
 * @returns {JSX.Element | null} The rendered button or null if Discord Client ID is invalid
 */
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

  /**
   * Size variants for the button
   * @type {Record<'sm' | 'md' | 'lg', string>}
   */
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  /**
   * Handles the click event to initiate Discord OAuth flow
   * @param {React.MouseEvent} e - The click event
   * @returns {Promise<void>}
   */
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