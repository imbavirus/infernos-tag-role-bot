/**
 * @file layout.tsx
 * @description Root layout component for the Next.js application
 * @module app/layout
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import '@/lib/server-init';
import NavBar from './components/NavBar';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

/**
 * Application metadata
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: 'Infernos Tag Role Bot',
  description: 'Automatically manage roles based on server tags',
  icons: {
    icon: '/infernos.png',
    apple: '/infernos.png'
  }
};

/**
 * Root layout component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} The root layout
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-white antialiased`}>
        <Providers>
          <NavBar />
          {children}
        </Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}