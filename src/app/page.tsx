'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FaTag, FaUsers, FaShieldAlt } from 'react-icons/fa';
import AddToDiscordButton from '@/components/AddToDiscordButton';

const NEXT_PUBLIC_DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_NEXT_PUBLIC_DISCORD_CLIENT_ID;

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col min-h-screen bg-dark-darker">
      {/* Hero Section */}
      <section className="relative w-full py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-lime/20 via-lime-dark/20 to-dark-darker/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="relative max-w-[2000px] mx-auto px-2 sm:px-4 py-32">
          <div className="text-center space-y-8">
            <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-lime-light via-lime to-lime-dark animate-gradient leading-tight pb-2">
              Infernos Tag Role Bot
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Automatically manage roles based on server tags. Keep your community organized and roles up-to-date with ease.
            </p>
            <div className="pt-4">
              <AddToDiscordButton size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-lime-light to-lime">
            Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-dark-lighter to-dark p-8 rounded-2xl border border-lime/20 hover:border-lime/50 transition-all duration-300 hover:shadow-xl hover:shadow-lime/10 transform hover:-translate-y-1">
              <div className="bg-gradient-to-br from-lime to-lime-dark p-3 rounded-xl w-fit mb-6">
                <FaTag className="text-3xl" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-lime-light">Server Tags</h3>
              <p className="text-gray-400 leading-relaxed">
                Automatically sync roles based on server tags, keeping your community organized.
              </p>
            </div>
            <div className="bg-gradient-to-br from-dark-lighter to-dark p-8 rounded-2xl border border-lime/20 hover:border-lime/50 transition-all duration-300 hover:shadow-xl hover:shadow-lime/10 transform hover:-translate-y-1">
              <div className="bg-gradient-to-br from-lime to-lime-dark p-3 rounded-xl w-fit mb-6">
                <FaUsers className="text-3xl" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-lime-light">Member Management</h3>
              <p className="text-gray-400 leading-relaxed">
                Effortlessly manage member roles across multiple servers with a single bot.
              </p>
            </div>
            <div className="bg-gradient-to-br from-dark-lighter to-dark p-8 rounded-2xl border border-lime/20 hover:border-lime/50 transition-all duration-300 hover:shadow-xl hover:shadow-lime/10 transform hover:-translate-y-1">
              <div className="bg-gradient-to-br from-lime to-lime-dark p-3 rounded-xl w-fit mb-6">
                <FaShieldAlt className="text-3xl" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-lime-light">Secure & Reliable</h3>
              <p className="text-gray-400 leading-relaxed">
                Built with security in mind, ensuring your server's roles are always up-to-date.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-24 bg-dark-lighter/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-lime-light to-lime">
            How It Works
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-16">
              <div className="flex items-start group">
                <div className="bg-gradient-to-br from-lime to-lime-dark rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-lime/25 group-hover:shadow-lime/40 transition-all duration-300">
                  <span className="text-xl font-bold">1</span>
                </div>
                <div className="ml-8">
                  <h3 className="text-2xl font-semibold mb-4 text-lime-light">Add the Bot</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Invite the bot to your server with the necessary permissions.
                  </p>
                </div>
              </div>
              <div className="flex items-start group">
                <div className="bg-gradient-to-br from-lime to-lime-dark rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-lime/25 group-hover:shadow-lime/40 transition-all duration-300">
                  <span className="text-xl font-bold">2</span>
                </div>
                <div className="ml-8">
                  <h3 className="text-2xl font-semibold mb-4 text-lime-light">Configure Roles</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Set up which roles should be assigned based on server tags.
                  </p>
                </div>
              </div>
              <div className="flex items-start group">
                <div className="bg-gradient-to-br from-lime to-lime-dark rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-lime/25 group-hover:shadow-lime/40 transition-all duration-300">
                  <span className="text-xl font-bold">3</span>
                </div>
                <div className="ml-8">
                  <h3 className="text-2xl font-semibold mb-4 text-lime-light">Automatic Updates</h3>
                  <p className="text-gray-300 leading-relaxed">
                    The bot automatically manages roles as members join or leave servers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 mt-auto border-t border-lime/20 bg-dark-darker">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-300">© {new Date().getFullYear()} Infernos Tag Role Bot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 