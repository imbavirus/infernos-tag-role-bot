/**
 * @file server.ts
 * @description Type definitions for Discord server data
 * @module types/server
 */

/**
 * Represents a Discord server (guild)
 * @interface Server
 * @property {string} id - The server's Discord ID
 * @property {string} name - The server's name
 * @property {string | null} icon - The server's icon hash, or null if no icon
 * @property {boolean} hasBot - Whether the bot is present in the server
 * @property {boolean} hasTagsFeature - Whether the server has the tags feature enabled
 */
export interface Server {
  id: string;
  name: string;
  icon: string | null;
  hasBot: boolean;
  hasTagsFeature: boolean;
} 