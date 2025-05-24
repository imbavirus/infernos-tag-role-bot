/**
 * @file NavBar.tsx
 * @description Navigation bar component for the application
 * @module app/components/NavBar
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { FaDiscord, FaUser, FaTachometerAlt, FaSignOutAlt, FaSignInAlt, FaChevronDown } from 'react-icons/fa';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

/**
 * Props for the NavBar component
 * @interface NavBarProps
 */
interface NavBarProps {}

/**
 * Navigation bar component
 * @component
 * @param {NavBarProps} props - Component props
 * @returns {JSX.Element} The navigation bar
 */
export default function NavBar({}: NavBarProps) {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const handleSignIn = async () => {
    try {
      console.log('Attempting to sign in...');
      const result = await signIn('discord', { 
        callbackUrl: '/dashboard',
        redirect: true,
        scope: 'identify email guilds',
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code'
      });
      console.log('Sign in result:', result);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="w-full bg-dark-lighter/50 border-b border-lime/20">
      <div className="max-w-[2000px] mx-auto px-2 sm:px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 pl-2">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/infernos.png"
                alt="Infernos Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-lime-light font-bold text-xl">Infernos Tag Role Bot</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 pr-2">
            {status === 'loading' ? (
              <div className="w-24 h-8 bg-dark/50 rounded-lg animate-pulse" />
            ) : status === 'authenticated' && session?.user ? (
              <>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 bg-dark/50 px-2 py-1.5 rounded-lg border border-lime/20 hover:border-lime/40 transition-all duration-300 shadow-lg shadow-lime/25 hover:shadow-lime/40"
                  >
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User avatar'}
                        width={28}
                        height={28}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-lime to-lime-dark flex items-center justify-center">
                        <FaUser className="text-xs" />
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-lime-light text-sm font-semibold">{session.user.name}</p>
                    </div>
                    <FaChevronDown className={`text-lime-light text-xs transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg bg-dark-lighter border border-lime/20 shadow-lg shadow-lime/25 overflow-hidden z-50">
                      <Link
                        href="/dashboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-dark hover:text-lime-light transition-colors duration-200 ${
                          pathname === '/dashboard'
                            ? 'text-lime'
                            : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        <FaTachometerAlt className="text-lime-light" />
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          signOut();
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-dark hover:text-lime-light transition-colors duration-200"
                      >
                        <FaSignOutAlt className="text-lime-light" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-dark-lighter to-dark hover:from-dark hover:to-dark-lighter transition-all duration-300 text-sm font-semibold shadow-lg shadow-lime/25 hover:shadow-lime/40 hover:scale-105 border border-lime/20"
              >
                <FaSignInAlt className="mr-1.5" />
                Sign in with Discord
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 