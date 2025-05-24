/**
 * @file server-init.ts
 * @description Server-side initialization and configuration
 * @module lib/server-init
 */

import { botService } from '@/services/bot';

let botStartPromise: Promise<void> | null = null;
let lastError: Error | null = null;
let lastErrorTime: number = 0;
const ERROR_CACHE_DURATION = 5000; // 5 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Initializes the server-side environment
 * @returns {Promise<void>}
 */
export async function initializeServer() {
  try {
    // Start the bot
    await botService.start();
  } catch (error) {
    console.error('Failed to initialize server:', error);
    throw error;
  }
}

/**
 * Ensures the bot is started, with proper error handling and retries
 * @returns {Promise<void>}
 */
export async function ensureBotStarted(): Promise<void> {
  // Skip bot initialization during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return Promise.resolve();
  }

  // If bot is already logged in, return immediately
  if (botService.isLoggedIn()) {
    return Promise.resolve();
  }

  // If there's already a start attempt in progress, wait for it
  if (botStartPromise) {
    return botStartPromise;
  }

  // Start the bot and store the promise
  botStartPromise = (async () => {
    try {
      console.log('Starting bot from server-init...');
      await botService.start();
      console.log('Bot started successfully from server-init');
    } catch (error) {
      console.error('Failed to start bot:', error);
      throw error;
    } finally {
      // Clear the promise after completion
      botStartPromise = null;
    }
  })();

  return botStartPromise;
}

// Start the bot immediately when this module is loaded
if (typeof window === 'undefined') {
  ensureBotStarted().catch(error => {
    console.error('Initial bot start failed:', error);
  });
} 