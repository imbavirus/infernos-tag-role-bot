'use client';

import { useState, useEffect } from 'react';

interface GuildConfig {
  id: string;
  guildId: string;
  representorsRoleId: string;
  logChannelId: string | null;
}

export default function Home() {
  const [guilds, setGuilds] = useState<GuildConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGuilds();
  }, []);

  const fetchGuilds = async () => {
    try {
      const response = await fetch('/api/guilds');
      const data = await response.json();
      setGuilds(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch guilds');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('/api/guilds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guildId: formData.get('guildId'),
          representorsRoleId: formData.get('representorsRoleId'),
          logChannelId: formData.get('logChannelId') || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update guild');
      
      await fetchGuilds();
      e.currentTarget.reset();
    } catch (err) {
      setError('Failed to update guild');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Guild Configuration</h1>
      
      <form onSubmit={handleSubmit} className="max-w-md mb-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="guildId" className="block text-sm font-medium mb-1">
              Guild ID
            </label>
            <input
              type="text"
              id="guildId"
              name="guildId"
              required
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label htmlFor="representorsRoleId" className="block text-sm font-medium mb-1">
              Representors Role ID
            </label>
            <input
              type="text"
              id="representorsRoleId"
              name="representorsRoleId"
              required
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label htmlFor="logChannelId" className="block text-sm font-medium mb-1">
              Log Channel ID (optional)
            </label>
            <input
              type="text"
              id="logChannelId"
              name="logChannelId"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Save Configuration
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Current Configurations</h2>
        {guilds.map((guild) => (
          <div key={guild.id} className="p-4 border rounded">
            <p><strong>Guild ID:</strong> {guild.guildId}</p>
            <p><strong>Representors Role ID:</strong> {guild.representorsRoleId}</p>
            <p><strong>Log Channel ID:</strong> {guild.logChannelId || 'Not set'}</p>
          </div>
        ))}
      </div>
    </main>
  );
} 