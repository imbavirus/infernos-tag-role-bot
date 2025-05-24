import { FaServer } from 'react-icons/fa';

interface Server {
  id: string;
  name: string;
  icon: string | null;
  hasBot: boolean;
  features?: string[];
}

interface ServerCardProps {
  server: Server;
  onSelect: () => void;
}

export function ServerCard({ server, onSelect }: ServerCardProps) {
  return (
    <button
      onClick={onSelect}
      className="w-full p-4 bg-dark-lighter rounded-lg border border-lime/20 hover:border-lime/40 transition-all duration-300"
    >
      <div className="flex items-center gap-3">
        {server.icon ? (
          <img
            src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`}
            alt={server.name}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lime to-lime-dark flex items-center justify-center">
            <FaServer className="text-lime-light text-xl" />
          </div>
        )}
        <div className="flex-1 text-left">
          <h3 className="text-lime-light font-semibold">{server.name}</h3>
          <div className="flex gap-2 mt-1">
            {!server.hasBot && (
              <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">Bot not present</span>
            )}
            {server.hasBot && !server.features?.includes('GUILD_TAGS') && (
              <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded">No Server Tag</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
} 