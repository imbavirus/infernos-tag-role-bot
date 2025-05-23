import { botService } from '@/services/bot';

// Start the bot automatically when the application starts
botService.start().catch(error => {
  console.error('Failed to start bot:', error);
});

// Export the bot service for use in other parts of the application
export { botService }; 