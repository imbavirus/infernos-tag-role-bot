/**
 * @file ServerList.tsx
 * @description A React component that displays a list of Discord servers with their status
 * @module components/ServerList
 */

'use client';

import React from 'react';
import { FaServer } from 'react-icons/fa';
import { Server } from '@/types/server';

/**
 * Props for the ServerList component
 * @interface ServerListProps
 * @property {Server[]} servers - Array of Discord servers to display
 * @property {Server | null} selectedServer - Currently selected server
 * @property {(server: Server) => void} onSelectServer - Callback function when a server is selected
 */
interface ServerListProps {
  servers: Server[];
  selectedServer: Server | null;
  onSelectServer: (server: Server) => void;
}

/**
 * A component that renders a list of Discord servers with their icons and status
 * @component
 * @param {ServerListProps} props - Component props
 * @returns {JSX.Element} The rendered server list
 */
export default function ServerList({ servers, selectedServer, onSelectServer }: ServerListProps) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Your Servers</h2>
      </div>
      <div className="divide-y divide-gray-700">
        {servers.map((server) => (
          <button
            key={server.id}
            onClick={() => onSelectServer(server)}
            className={`w-full p-4 flex items-center gap-3 hover:bg-gray-700 transition-colors ${
              selectedServer?.id === server.id ? 'bg-gray-700' : ''
            }`}
          >
            {server.icon ? (
              <img
                src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`}
                alt={server.name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                <FaServer className="text-gray-400" />
              </div>
            )}
            <div className="flex-1 text-left">
              <div className="font-medium">{server.name}</div>
              <div className="text-sm text-gray-400">
                {!server.hasBot ? (
                  <span className="text-red-400">Bot not present</span>
                ) : !server.hasTagsFeature ? (
                  <span className="text-yellow-400">No Server Tag</span>
                ) : (
                  <span className="text-green-400">Configured</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 