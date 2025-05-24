'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-dark-darker py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-dark-lighter rounded-2xl border border-lime/20 p-8">
          <h1 className="text-4xl font-bold text-lime-light mb-8">Privacy Policy</h1>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-lime mb-4">1. Information We Collect</h2>
              <p>We collect and store:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
                <li>Discord user IDs and server IDs</li>
                <li>Server configuration settings (role IDs, channel IDs)</li>
                <li>Role change logs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-lime mb-4">2. How We Use Information</h2>
              <p>We use the collected information to:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
                <li>Provide and maintain the bot's functionality</li>
                <li>Track role changes for logging purposes</li>
                <li>Improve the bot's performance and features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-lime mb-4">3. Data Storage</h2>
              <p>All data is stored securely and is only accessible to authorized personnel. We do not share your data with third parties.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-lime mb-4">4. User Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
                <li>Request access to your stored data</li>
                <li>Request deletion of your data</li>
                <li>Opt out of data collection by removing the bot from your server</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-lime mb-4">5. Contact</h2>
              <p>For privacy-related inquiries, please contact us through our Discord server.</p>
            </section>

            <div className="pt-8">
              <Link 
                href="/"
                className="text-lime hover:text-lime-light transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 