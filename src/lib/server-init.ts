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
 * Ensures the bot is started and ready to handle requests
 * @async
 * @function ensureBotStarted
 * @returns {Promise<void>} A promise that resolves when the bot is started
 * @throws {Error} If the bot fails to start
 */
export async function ensureBotStarted() {
  // If we have a recent error, don't try to start the bot again immediately
  if (lastError && Date.now() - lastErrorTime < ERROR_CACHE_DURATION) {
    throw lastError;
  }

  if (!botStartPromise) {
    console.log('Starting bot from server-init...');
    botStartPromise = botService.start()
      .then(() => {
        // Clear any previous errors on successful start
        lastError = null;
        lastErrorTime = 0;
        console.log('Bot started successfully from server-init');
      })
      .catch(error => {
        console.error('Failed to start bot from server-init:', error);
        lastError = error;
        lastErrorTime = Date.now();
        botStartPromise = null;
        throw error;
      });
  }

  try {
    await botStartPromise;
  } catch (error) {
    // If the bot is already logged in despite the error, we can proceed
    if (botService.isLoggedIn()) {
      return;
    }
    throw error;
  }
}

// Start the bot immediately when this module is loaded
if (typeof window === 'undefined') {
  ensureBotStarted().catch(error => {
    console.error('Initial bot start failed:', error);
  });
} 