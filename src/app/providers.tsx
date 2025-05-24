/**
 * @file providers.tsx
 * @description Global providers wrapper component
 * @module app/providers
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

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
      throw new Error('Failed to initialize bot');
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
 * Wrapper component that provides global context providers
 * @component
 * @param {ProvidersProps} props - Component props
 * @returns {JSX.Element} The providers wrapper
 */
export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    initializeBot();
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
} 