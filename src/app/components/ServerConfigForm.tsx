'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FaServer, FaUserTag, FaHashtag } from 'react-icons/fa';

interface Guild {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  color: string;
}

interface Channel {
  id: string;
  name: string;
  type: number;
}

export default function ServerConfigForm() {
  const { data: session } = useSession();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedGuild, setSelectedGuild] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchGuilds();
    }
  }, [session]);

  useEffect(() => {
    if (selectedGuild) {
      fetchRoles();
      fetchChannels();
    } else {
      setRoles([]);
      setChannels([]);
    }
  }, [selectedGuild]);

  const fetchGuilds = async () => {
    try {
      const response = await fetch('/api/guilds/list');
      if (!response.ok) throw new Error('Failed to fetch guilds');
      const data = await response.json();
      setGuilds(data.guilds);
    } catch (error) {
      console.error('Error fetching guilds:', error);
      setError('Failed to load servers');
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`/api/guilds/${selectedGuild}/roles`);
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles(data.roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError('Failed to load roles');
    }
  };

  const fetchChannels = async () => {
    try {
      const response = await fetch(`/api/guilds/${selectedGuild}/channels`);
      if (!response.ok) throw new Error('Failed to fetch channels');
      const data = await response.json();
      setChannels(data.channels);
    } catch (error) {
      console.error('Error fetching channels:', error);
      setError('Failed to load channels');
    }
  };

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
          guildId: selectedGuild,
          representorsRoleId: selectedRole,
          logChannelId: selectedChannel || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save configuration');
      }

      setSuccess(true);
      setSelectedGuild('');
      setSelectedRole('');
      setSelectedChannel('');
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
      <div>
        <label htmlFor="guild" className="block text-sm font-medium text-lime-light mb-2">
          <div className="flex items-center gap-2">
            <FaServer className="text-lime" />
            Select Server
          </div>
        </label>
        <select
          id="guild"
          value={selectedGuild}
          onChange={(e) => setSelectedGuild(e.target.value)}
          className="w-full bg-dark border border-lime/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-lime/40 focus:ring-1 focus:ring-lime/40"
          required
        >
          <option value="">Select a server</option>
          {guilds.map((guild) => (
            <option key={guild.id} value={guild.id}>
              {guild.name}
            </option>
          ))}
        </select>
      </div>

      {selectedGuild && (
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
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id} style={{ color: `#${role.color}` }}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="channel" className="block text-sm font-medium text-lime-light mb-2">
              <div className="flex items-center gap-2">
                <FaHashtag className="text-lime" />
                Select Log Channel (Optional)
              </div>
            </label>
            <select
              id="channel"
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full bg-dark border border-lime/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-lime/40 focus:ring-1 focus:ring-lime/40"
            >
              <option value="">No channel selected</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  #{channel.name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

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
        disabled={loading || !selectedGuild || !selectedRole}
        className={`w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300
          ${loading || !selectedGuild || !selectedRole
            ? 'bg-dark-lighter text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-lime to-lime-dark hover:from-lime-light hover:to-lime text-dark-darker shadow-lg shadow-lime/25 hover:shadow-lime/40 hover:scale-105'
          }`}
      >
        {loading ? 'Saving...' : 'Save Configuration'}
      </button>
    </form>
  );
} 