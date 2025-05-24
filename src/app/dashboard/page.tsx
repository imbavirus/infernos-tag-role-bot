'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaServer, FaChevronDown } from 'react-icons/fa';
import ServerConfigForm from '../components/ServerConfigForm';
import AddToDiscordButton from '@/components/AddToDiscordButton';

interface Server {
  id: string;
  name: string;
  icon: string | null;
  hasBot: boolean;
  hasTagsFeature?: boolean;
}

interface Role {
  id: string;
  name: string;
  color: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isServerDropdownOpen, setIsServerDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle OAuth callback parameters
  useEffect(() => {
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    const guildId = searchParams.get('guild_id');

    if (error) {
      setError(error === 'no_code' ? 'Authorization failed' : 'Failed to add bot to server');
    } else if (success) {
      setSuccess('Bot successfully added to server!');
      // If we have a guild ID, select that server
      if (guildId) {
        const server = servers.find(s => s.id === guildId);
        if (server) {
          setSelectedServer(server);
        }
      }
      // Refresh the servers list by triggering a re-fetch
      if (status === 'authenticated') {
        fetch('/api/servers')
          .then(response => response.json())
          .then(data => {
            setServers(data);
            setError(null);
          })
          .catch(error => {
            console.error('Error refreshing servers:', error);
            setError('Failed to refresh server list');
          });
      }
    }
  }, [searchParams, servers, status]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    }
  }, [status, router]);

  // Fetch user's servers
  useEffect(() => {
    const fetchServers = async () => {
      try {
        console.log('Starting server fetch...');
        console.log('Authentication status:', status);
        console.log('Session data:', session);
        
        const response = await fetch('/api/servers');
        console.log('Server response status:', response.status);
        console.log('Server response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Server fetch error response:', errorData);
          throw new Error(errorData.error || 'Failed to fetch servers');
        }
        
        const data = await response.json();
        console.log('Server data received:', data);
        setServers(data);
        setError(null);

        // Check for guild_id in URL and select the corresponding server
        const guildId = searchParams.get('guild_id');
        if (guildId) {
          const server = data.find((s: Server) => s.id === guildId);
          if (server) {
            setSelectedServer(server);
          }
        }
      } catch (error) {
        console.error('Error fetching servers:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch servers');
      } finally {
        console.log('Server fetch completed, setting isLoading to false');
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      console.log('User is authenticated, starting server fetch...');
      fetchServers();
    } else {
      console.log('User authentication status:', status);
      setIsLoading(false);
    }
  }, [status, session, searchParams]);

  // Fetch roles when server is selected
  useEffect(() => {
    const fetchRoles = async () => {
      if (!selectedServer || !selectedServer.hasBot) return;
      
      try {
        setError(null);
        const response = await fetch(`/api/servers/${selectedServer.id}/roles`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch roles');
        }
        const data = await response.json();
        setRoles(data);
      } catch (error) {
        console.error('Error fetching roles:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch roles');
      }
    };

    fetchRoles();
  }, [selectedServer]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-dark-darker flex items-center justify-center">
        <div className="text-lime-light text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-darker flex items-center justify-center">
        <div className="text-red-400 text-xl bg-red-900/20 border border-red-900/40 rounded-lg p-6">
          {error}
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-dark-darker flex justify-center p-4 pt-4">
      <div className="w-full max-w-2xl bg-dark-lighter rounded-2xl border border-lime/20 shadow-xl shadow-lime/25 h-fit">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-lime-light mb-2">Dashboard</h1>
            <p className="text-gray-400">Manage your server roles and tags</p>
          </div>

          {success && (
            <div className="mb-8 p-4 bg-green-500/20 border border-green-500/40 rounded-lg">
              <p className="text-green-400">{success}</p>
            </div>
          )}

          {/* Server Selector */}
          <div className="relative mb-8">
            <button
              onClick={() => setIsServerDropdownOpen(!isServerDropdownOpen)}
              className="flex items-center gap-3 bg-dark px-4 py-3 rounded-lg border border-lime/20 hover:border-lime/40 transition-all duration-300 w-full"
            >
              {selectedServer ? (
                <>
                  {selectedServer.icon ? (
                    <img
                      src={`https://cdn.discordapp.com/icons/${selectedServer.id}/${selectedServer.icon}.png`}
                      alt={selectedServer.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime to-lime-dark flex items-center justify-center">
                      <FaServer className="text-lime-light" />
                    </div>
                  )}
                  <span className="text-lime-light font-semibold">{selectedServer.name}</span>
                  <div className="ml-auto flex items-center gap-2 mr-2">
                    {!selectedServer.hasBot && (
                      <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">Bot not present</span>
                    )}
                    {selectedServer.hasBot && !selectedServer.hasTagsFeature && (
                      <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded">No Server Tag</span>
                    )}
                  </div>
                  <FaChevronDown className={`text-lime-light transition-transform duration-300 ${isServerDropdownOpen ? 'rotate-180' : ''}`} />
                </>
              ) : (
                <>
                  <FaServer className="text-lime-light" />
                  <span className="text-lime-light font-semibold">Select a Server</span>
                  <FaChevronDown className={`text-lime-light ml-auto transition-transform duration-300 ${isServerDropdownOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {isServerDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-dark rounded-lg border border-lime/20 shadow-lg shadow-lime/25 overflow-hidden z-50 max-h-[300px] overflow-y-auto custom-scrollbar">
                {servers
                  .sort((a, b) => {
                    // Sort servers with bot to the top
                    if (a.hasBot && !b.hasBot) return -1;
                    if (!a.hasBot && b.hasBot) return 1;
                    return a.name.localeCompare(b.name);
                  })
                  .map((server) => (
                    <button
                      key={server.id}
                      onClick={() => {
                        setSelectedServer(server);
                        setIsServerDropdownOpen(false);
                        // Update URL with guild_id
                        router.push(`/dashboard?guild_id=${server.id}`, { scroll: false });
                      }}
                      className={`flex items-center gap-3 w-full px-4 py-3 hover:bg-dark-lighter transition-colors duration-200 ${
                        !server.hasBot ? 'opacity-50' : ''
                      }`}
                    >
                      {server.icon ? (
                        <img
                          src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`}
                          alt={server.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime to-lime-dark flex items-center justify-center">
                          <FaServer className="text-lime-light" />
                        </div>
                      )}
                      <span className="text-lime-light">{server.name}</span>
                      <div className="ml-auto flex gap-2">
                        {!server.hasBot && (
                          <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">Bot not present</span>
                        )}
                        {server.hasBot && !server.hasTagsFeature && (
                          <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded">No Server Tag</span>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {selectedServer && !selectedServer.hasBot && (
            <div className="mb-8 p-6 bg-dark rounded-lg border border-lime/20 text-center">
              <h3 className="text-xl font-semibold text-lime-light mb-4">Add Bot to Server</h3>
              <p className="text-gray-400 mb-6">To use the tag role feature, you need to add the bot to your server first.</p>
              <div className="flex justify-center">
                <AddToDiscordButton size="md" guildId={selectedServer.id} />
              </div>
            </div>
          )}

          {selectedServer && selectedServer.hasBot && (
            <ServerConfigForm
              serverId={selectedServer.id}
              hasTagsFeature={selectedServer.hasTagsFeature}
            />
          )}
        </div>
      </div>
    </div>
  );
} 