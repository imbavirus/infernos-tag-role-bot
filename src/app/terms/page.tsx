'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-dark-darker py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-dark-lighter rounded-2xl border border-lime/20 p-8">
          <h1 className="text-4xl font-bold text-lime-light mb-8">Terms of Service</h1>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-lime mb-4">1. Acceptance of Terms</h2>
              <p>By using Infernos Tag Role Bot ("the Bot"), you agree to be bound by these Terms of Service.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-lime mb-4">2. Description of Service</h2>
              <p>The Bot provides automated role management based on server tags in Discord servers. It requires the Server Tags feature to be enabled on the server.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-lime mb-4">3. User Responsibilities</h2>
              <p>Users are responsible for:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
                <li>Ensuring the bot has appropriate permissions in their server</li>
                <li>Positioning the bot's role higher than the roles it needs to manage</li>
                <li>Maintaining the Server Tags feature on their server</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-lime mb-4">4. Limitation of Liability</h2>
              <p>The Bot is provided "as is" without any warranties. We are not liable for any damages arising from the use or inability to use the Bot.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-lime mb-4">5. Changes to Terms</h2>
              <p>We reserve the right to modify these terms at any time. Users will be notified of significant changes.</p>
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