import { botService } from '@/services/bot';

let botStartPromise: Promise<void> | null = null;

export async function ensureBotStarted() {
  if (!botStartPromise) {
    botStartPromise = botService.start().catch(error => {
      console.error('Failed to start bot:', error);
      botStartPromise = null;
      throw error;
    });
  }
  return botStartPromise;
} 