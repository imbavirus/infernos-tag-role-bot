/**
 * @file ServerConfigForm.tsx
 * @description Server configuration form component for managing role and channel settings
 * @module app/components/ServerConfigForm
 */

'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FaUserTag, FaHashtag } from 'react-icons/fa';
import { Server } from '@/types/server';

/**
 * Represents a Discord role
 * @interface Role
 * @property {string} id - The unique identifier of the role
 * @property {string} name - The name of the role
 * @property {string} color - The color of the role in hexadecimal format
 */
interface Role {
  id: string;
  name: string;
  color: string;
}

/**
 * Represents a Discord channel
 * @interface Channel
 * @property {string} id - The unique identifier of the channel
 * @property {string} name - The name of the channel
 * @property {number} type - The type of the channel
 * @property {boolean} isCategory - Whether the channel is a category
 * @property {string} [parentId] - The ID of the parent category, if any
 * @property {number} position - The position of the channel in the channel list
 */
interface Channel {
  id: string;
  name: string;
  type: number;
  isCategory: boolean;
  parentId?: string;
  position: number;
}

/**
 * Props for the ServerConfigForm component
 * @interface ServerConfigFormProps
 * @property {Server} server - The server to configure
 * @property {boolean} [hasTagsFeature=false] - Whether the server has the tags feature enabled
 */
interface ServerConfigFormProps {
  server: Server;
  hasTagsFeature?: boolean;
}

/**
 * Server configuration form component
 * @component
 * @param {ServerConfigFormProps} props - Component props
 * @returns {JSX.Element} The server configuration form
 */
export default function ServerConfigForm({ server, hasTagsFeature = false }: ServerConfigFormProps) {
  const { data: session } = useSession();
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);

  /**
   * Determines if a color is dark based on its luminance
   * @function isDarkColor
   * @param {string} hexColor - The color in hexadecimal format
   * @returns {boolean} True if the color is dark, false otherwise
   */
  const isDarkColor = (hexColor: string) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(0, 2), 16);
    const g = parseInt(hexColor.slice(2, 4), 16);
    const b = parseInt(hexColor.slice(4, 6), 16);
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance < 0.5;
  };

  /**
   * Lightens a color by 50%
   * @function lightenColor
   * @param {string} hexColor - The color in hexadecimal format
   * @returns {string} The lightened color in hexadecimal format
   */
  const lightenColor = (hexColor: string) => {
    // Convert hex to RGB
    let r = parseInt(hexColor.slice(0, 2), 16);
    let g = parseInt(hexColor.slice(2, 4), 16);
    let b = parseInt(hexColor.slice(4, 6), 16);

    // Lighten the color by 50%
    r = Math.min(255, Math.round(r + (255 - r) * 0.5));
    g = Math.min(255, Math.round(g + (255 - g) * 0.5));
    b = Math.min(255, Math.round(b + (255 - b) * 0.5));

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  /**
   * Gets the appropriate text color based on the background color
   * @function getTextColor
   * @param {string} hexColor - The background color in hexadecimal format
   * @returns {string} The text color in hexadecimal format
   */
  const getTextColor = (hexColor: string) => {
    return isDarkColor(hexColor) ? lightenColor(hexColor) : `#${hexColor}`;
  };

  useEffect(() => {
    if (server.id) {
      fetchRoles();
      fetchChannels();
      fetchConfig();
    }
  }, [server.id]);

  /**
   * Fetches the roles for the server
   * @async
   * @function fetchRoles
   * @returns {Promise<void>}
   */
  const fetchRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const response = await fetch(`/api/servers/${server.id}/roles`);
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError('Failed to load roles');
    } finally {
      setIsLoadingRoles(false);
    }
  };

  /**
   * Fetches the channels for the server
   * @async
   * @function fetchChannels
   * @returns {Promise<void>}
   */
  const fetchChannels = async () => {
    try {
      setIsLoadingChannels(true);
      const response = await fetch(`/api/servers/${server.id}/channels`);
      if (!response.ok) throw new Error('Failed to fetch channels');
      const data = await response.json();
      setChannels(data);
    } catch (error) {
      console.error('Error fetching channels:', error);
      setError('Failed to load channels');
    } finally {
      setIsLoadingChannels(false);
    }
  };

  /**
   * Fetches the current configuration for the server
   * @async
   * @function fetchConfig
   * @returns {Promise<void>}
   */
  const fetchConfig = async () => {
    try {
      const response = await fetch(`/api/guilds/${server.id}`);
      if (!response.ok) throw new Error('Failed to fetch configuration');
      const data = await response.json();
      if (data) {
        setSelectedRole(data.representorsRoleId || '');
        setSelectedChannel(data.logChannelId || '');
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
    }
  };

  /**
   * Handles form submission to save the server configuration
   * @async
   * @function handleSubmit
   * @param {React.FormEvent} e - The form submission event
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/guilds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guildId: server.id,
          representorsRoleId: selectedRole,
          logChannelId: selectedChannel || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save configuration');
      }

      setSuccess(true);
    } catch (error) {
      console.error('Error saving configuration:', error);
      setError(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-400">Please sign in to configure servers.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!hasTagsFeature && (
        <div className="text-yellow-400 text-sm bg-yellow-900/20 border border-yellow-900/40 rounded-lg p-3">
          This server does not have the Server Tags feature enabled. Please enable it in your server settings to use this bot.
        </div>
      )}

      {hasTagsFeature && (
        <>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-lime-light mb-2">
              <div className="flex items-center gap-2">
                <FaUserTag className="text-lime" />
                Select Role
              </div>
            </label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-dark border border-lime/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-lime/40 focus:ring-1 focus:ring-lime/40"
              required
              disabled={isLoadingRoles}
            >
              <option value="">{isLoadingRoles ? 'Loading roles...' : 'Select a role'}</option>
              {!isLoadingRoles && roles.map((role) => (
                <option 
                  key={role.id} 
                  value={role.id} 
                  style={{ 
                    color: getTextColor(role.color)
                  }}
                >
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="channelId" className="block text-sm font-medium text-lime-light mb-2">
              <div className="flex items-center gap-2">
                <FaHashtag className="text-lime" />
                Select Channel
              </div>
            </label>
            <select
              id="channelId"
              name="channelId"
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full bg-dark border border-lime/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-lime/40 focus:ring-1 focus:ring-lime/40"
              disabled={isLoadingChannels}
            >
              <option value="">{isLoadingChannels ? 'Loading channels...' : 'Select a channel'}</option>
              {!isLoadingChannels && channels
                .filter(channel => !channel.isCategory)
                .sort((a, b) => {
                  if (a.parentId === b.parentId) {
                    return a.position - b.position;
                  }
                  if (a.parentId && !b.parentId) return -1;
                  if (!a.parentId && b.parentId) return 1;
                  const categoryA = channels.find(c => c.id === a.parentId);
                  const categoryB = channels.find(c => c.id === b.parentId);
                  if (categoryA && categoryB) {
                    return categoryA.position - categoryB.position;
                  }
                  return 0;
                })
                .map(channel => {
                  const category = channel.parentId 
                    ? channels.find(c => c.id === channel.parentId)
                    : null;
                  return (
                    <option 
                      key={channel.id} 
                      value={channel.id}
                      disabled={channel.isCategory}
                      className={channel.isCategory ? 'font-bold text-gray-400' : ''}
                    >
                      {category ? `${category.name} > ${channel.name}` : channel.name}
                    </option>
                  );
                })}
            </select>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-lg p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="text-lime-light text-sm bg-lime/10 border border-lime/20 rounded-lg p-3">
              Configuration saved successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedRole}
            className={`w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300
              ${loading || !selectedRole
                ? 'bg-dark-lighter text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-lime to-lime-dark hover:from-lime-light hover:to-lime text-dark-darker shadow-lg shadow-lime/25 hover:shadow-lime/40 hover:scale-105'
              }`}
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </>
      )}
    </form>
  );
} 