import { botService } from '@/services/bot';

let botStartPromise: Promise<void> | null = null;
let lastError: Error | null = null;
let lastErrorTime: number = 0;
const ERROR_CACHE_DURATION = 5000; // 5 seconds

export async function ensureBotStarted() {
  // If we have a recent error, don't try to start the bot again immediately
  if (lastError && Date.now() - lastErrorTime < ERROR_CACHE_DURATION) {
    throw lastError;
  }

  if (!botStartPromise) {
    botStartPromise = botService.start()
      .then(() => {
        // Clear any previous errors on successful start
        lastError = null;
        lastErrorTime = 0;
      })
      .catch(error => {
        console.error('Failed to start bot:', error);
        lastError = error;
        lastErrorTime = Date.now();
        botStartPromise = null;
        throw error;
      });
  }
  return botStartPromise;
} 