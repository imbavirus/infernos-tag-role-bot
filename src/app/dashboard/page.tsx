'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaServer, FaChevronDown } from 'react-icons/fa';
import ServerConfigForm from '../components/ServerConfigForm';

interface Server {
  id: string;
  name: string;
  icon: string | null;
}

interface Role {
  id: string;
  name: string;
  color: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isServerDropdownOpen, setIsServerDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        const response = await fetch('/api/servers');
        const data = await response.json();
        setServers(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching servers:', error);
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchServers();
    }
  }, [status]);

  // Fetch roles when server is selected
  useEffect(() => {
    const fetchRoles = async () => {
      if (!selectedServer) return;
      
      try {
        const response = await fetch(`/api/servers/${selectedServer.id}/roles`);
        const data = await response.json();
        setRoles(data);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };

    fetchRoles();
  }, [selectedServer]);

  // Show loading state while checking authentication
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-dark-darker flex items-center justify-center">
        <div className="text-lime-light text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="bg-dark-darker flex justify-center p-4 pt-20">
      <div className="w-full max-w-2xl bg-dark-lighter rounded-2xl border border-lime/20 shadow-xl shadow-lime/25">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-lime-light mb-2">Dashboard</h1>
            <p className="text-gray-400">Manage your server roles and tags</p>
          </div>

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
                </>
              ) : (
                <>
                  <FaServer className="text-lime-light" />
                  <span className="text-lime-light font-semibold">Select a Server</span>
                </>
              )}
              <FaChevronDown className={`text-lime-light ml-auto transition-transform duration-300 ${isServerDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isServerDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-dark rounded-lg border border-lime/20 shadow-lg shadow-lime/25 overflow-hidden z-50">
                {servers.map((server) => (
                  <button
                    key={server.id}
                    onClick={() => {
                      setSelectedServer(server);
                      setIsServerDropdownOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-dark-lighter transition-colors duration-200"
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
                    <span className="text-gray-300">{server.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Configuration Form */}
          {selectedServer && (
            <div className="bg-dark rounded-lg border border-lime/20 p-6">
              <h2 className="text-xl font-semibold text-lime-light mb-4">Server Configuration</h2>
              <ServerConfigForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 