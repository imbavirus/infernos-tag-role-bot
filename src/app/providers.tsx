/**
 * @file providers.tsx
 * @description Global providers wrapper component
 * @module app/providers
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';

/**
 * Initializes the bot by checking its status
 * @async
 * @function initializeBot
 * @returns {Promise<void>}
 */
async function initializeBot() {
  try {
    const response = await fetch('/api/bot', {
      method: 'GET',
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const data = await response.json();
      if (response.status === 401) {
        // Only sign out if we're actually authenticated
        const session = await fetch('/api/auth/session').then(res => res.json());
        if (session?.user) {
          signOut({ callbackUrl: '/' });
        }
        return;
      }
      throw new Error(data.error || 'Failed to initialize bot');
    }
  } catch (error) {
    console.error('Error initializing bot:', error);
  }
}

/**
 * Props for the Providers component
 * @interface ProvidersProps
 * @property {React.ReactNode} children - Child components to wrap with providers
 */
interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Inner component that handles bot initialization
 * @component
 * @param {ProvidersProps} props - Component props
 * @returns {JSX.Element} The initialized content
 */
function BotInitializer({ children }: ProvidersProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!session?.user) {
        setIsInitializing(false);
        return;
      }

      try {
        await initializeBot();
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [session]);

  if (isInitializing) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Wrapper component that provides global context providers
 * @component
 * @param {ProvidersProps} props - Component props
 * @returns {JSX.Element} The providers wrapper
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <BotInitializer>{children}</BotInitializer>
    </SessionProvider>
  );
} 