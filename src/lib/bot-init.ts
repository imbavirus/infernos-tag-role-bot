/**
 * @file bot-init.ts
 * @description Bot service initialization and singleton instance
 * @module lib/bot-init
 */

import { botService } from '@/services/bot';

// Only run on server side
if (typeof window === 'undefined') {
  // Start the bot automatically when the application starts
  console.log('Initializing bot on server side...');
  botService.start().catch((error: Error) => {
    console.error('Failed to start bot:', error);
  });
}

/**
 * Global bot service instance
 * @type {typeof botService}
 */
export const bot = botService;

// Export the bot service for use in other parts of the application
export { botService }; 