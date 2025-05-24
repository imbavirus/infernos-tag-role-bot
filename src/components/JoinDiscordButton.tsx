/**
 * @file JoinDiscordButton.tsx
 * @description A React component that renders a button to join the Discord server
 * @module components/JoinDiscordButton
 */

'use client';

import React from 'react';
import { FaDiscord } from 'react-icons/fa';

/**
 * Props for the JoinDiscordButton component
 * @interface JoinDiscordButtonProps
 * @property {string} [className] - Additional CSS classes to apply to the button
 * @property {'sm' | 'md' | 'lg'} [size='md'] - Size variant of the button
 */
interface JoinDiscordButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A button component that links to the Discord server
 * @component
 * @param {JoinDiscordButtonProps} props - Component props
 * @returns {JSX.Element | null} The rendered button or null if Discord invite link is not set
 */
export default function JoinDiscordButton({ className = '', size = 'md' }: JoinDiscordButtonProps) {
  const DISCORD_INVITE_LINK = process.env.NEXT_PUBLIC_DISCORD_INVITE_LINK;
  
  if (!DISCORD_INVITE_LINK) {
    console.error('Discord invite link is not set in environment variables');
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

  return (
    <a 
      href={DISCORD_INVITE_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center rounded-xl bg-gradient-to-r from-discord to-discord-dark hover:from-discord hover:to-discord-dark transition-all duration-300 font-semibold shadow-lg shadow-discord/25 hover:shadow-discord/40 hover:scale-105 ${sizeClasses[size]} ${className}`}
    >
      <FaDiscord className="mr-3 text-xl" />
      Join our Discord
    </a>
  );
} 