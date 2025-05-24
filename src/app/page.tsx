/**
 * @file page.tsx
 * @description Landing page component for the Infernos Tag Role Bot
 * @module app/page
 */

'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FaTag, FaUsers, FaShieldAlt } from 'react-icons/fa';
import AddToDiscordButton from '@/components/AddToDiscordButton';
import JoinDiscordButton from '@/components/JoinDiscordButton';

/**
 * Checks if email settings are configured
 * @returns {boolean} Whether email settings are configured
 */
const isEmailConfigured = () => {
  return process.env.NEXT_PUBLIC_ENABLE_EMAIL === 'true';
};

/**
 * Home page component that displays the landing page with features and how it works sections
 * @returns {JSX.Element} The landing page
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-dark flex flex-col">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-6xl font-bold mb-6 leading-tight tracking-tight bg-gradient-to-r from-lime to-lime-light bg-clip-text text-transparent animate-gradient">
              Infernos Tag Role Bot
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Automatically manage roles based on server tags. Keep your server organized with ease.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <AddToDiscordButton size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-dark-lighter to-dark p-8 rounded-2xl border border-lime/20 hover:border-lime/50 transition-all duration-300 hover:shadow-xl hover:shadow-lime/10 transform hover:-translate-y-1">
              <div className="bg-gradient-to-br from-lime to-lime-dark p-3 rounded-xl w-fit mb-6">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-lime-light">Server Tags</h3>
              <p className="text-gray-400 leading-relaxed">
                Automatically detect when users have your server tag in their username
              </p>
            </div>

            <div className="bg-gradient-to-br from-dark-lighter to-dark p-8 rounded-2xl border border-lime/20 hover:border-lime/50 transition-all duration-300 hover:shadow-xl hover:shadow-lime/10 transform hover:-translate-y-1">
              <div className="bg-gradient-to-br from-lime to-lime-dark p-3 rounded-xl w-fit mb-6">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-lime-light">Role Management</h3>
              <p className="text-gray-400 leading-relaxed">
                Easily configure which role to assign to users with your server tag
              </p>
            </div>

            <div className="bg-gradient-to-br from-dark-lighter to-dark p-8 rounded-2xl border border-lime/20 hover:border-lime/50 transition-all duration-300 hover:shadow-xl hover:shadow-lime/10 transform hover:-translate-y-1">
              <div className="bg-gradient-to-br from-lime to-lime-dark p-3 rounded-xl w-fit mb-6">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-lime-light">Automatic Role Management</h3>
              <p className="text-gray-400 leading-relaxed">
                Automatically add and remove users from the role based on their server tag
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 mt-auto border-t border-lime/20 bg-dark-darker">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-300 mb-4">© {new Date().getFullYear()} Infernos Tag Role Bot. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <JoinDiscordButton size="sm" />
          </div>
          <div className="flex justify-center gap-6">
            <Link href="/terms" className="text-gray-400 hover:text-lime transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-lime transition-colors">
              Privacy Policy
            </Link>
            {isEmailConfigured() && (
              <Link href="/support" className="text-gray-400 hover:text-lime transition-colors">
                Support
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
} 