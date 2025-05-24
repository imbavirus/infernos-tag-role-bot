/**
 * @file bot.ts
 * @description Discord bot service for managing server tags and roles
 * @module services/bot
 */

import { Client, GatewayIntentBits, Guild, GuildMember, TextChannel, EmbedBuilder, MessageCreateOptions, APIEmbed, DiscordAPIError, Role } from 'discord.js';
import { prisma } from '@/lib/prisma';

/**
 * Represents the guild data structure for a user
 * @interface GuildData
 * @property {Object} user - User information
 * @property {string} user.id - User's Discord ID
 * @property {Object} [user.primary_guild] - User's primary guild information
 * @property {string} user.primary_guild.identity_guild_id - ID of the user's primary guild
 */
interface GuildData {
  user: {
    id: string;
    primary_guild?: {
      identity_guild_id: string;
    };
  };
}

/**
 * Represents a role change event
 * @interface RoleChange
 * @property {'add' | 'remove'} type - Type of role change
 * @property {GuildMember} member - The member whose role was changed
 */
interface RoleChange {
  type: 'add' | 'remove';
  member: GuildMember;
}

/**
 * Represents the configuration for a guild
 * @interface GuildConfig
 * @property {string} guildId - Discord guild ID
 * @property {string} roleId - ID of the role to assign
 * @property {string | null} logChannelId - ID of the channel for logging role changes
 */
interface GuildConfig {
  guildId: string;
  roleId: string;
  logChannelId: string | null;
}

/**
 * Service class for managing the Discord bot
 * @class BotService
 */
export class BotService {
  private client: Client;
  private processingPromise: Promise<void> | null = null;
  private readyPromise: Promise<void>;
  private readyResolve: (() => void) | null = null;
  private readyReject: ((error: Error) => void) | null = null;
  private readonly LOGIN_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds
  private tokenVerificationCache: {
    isValid: boolean;
    timestamp: number;
  } | null = null;
  private readonly TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private isInitializing: boolean = false;
  private lastHeartbeat: number = 0;
  private readonly HEARTBEAT_INTERVAL = 60000; // 1 minute
  private readonly HEARTBEAT_DEBOUNCE = 5000; // 5 seconds
  private initializationError: Error | null = null;
  private lastInitializationAttempt: number = 0;
  private readonly INITIALIZATION_COOLDOWN = 5000; // 5 seconds

  // Add rate limit handling
  private rateLimitCache = new Map<string, {
    resetAt: number;
    remaining: number;
  }>();

  // Add caching
  private guildCache = new Map<string, {
    data: Guild;
    timestamp: number;
  }>();
  private memberCache = new Map<string, {
    data: GuildMember[];
    timestamp: number;
  }>();

  /**
   * Creates a new instance of BotService
   * @constructor
   */
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
      ],
      rest: {
        timeout: 15000, // 15 seconds
      }
    });

    // Set debug level based on environment
    if (process.env.NODE_ENV !== 'development') {
      process.env.DISCORD_DEBUG = '0';
    }

    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });

    this.setupEventHandlers();
  }

  /**
   * Sets up event handlers for the Discord client
   * @private
   */
  private setupEventHandlers() {
    this.client.on('ready', async () => {
      console.log('Bot is ready');
      if (this.readyResolve) {
        this.readyResolve();
      }
      try {
        await this.initializeGuilds();
      } catch (error) {
        console.error('Error initializing guilds:', error);
      }
    });

    this.client.on('error', (error) => {
      console.error('Bot encountered an error:', error);
      if (this.readyReject) {
        this.readyReject(error);
      }
    });

    this.client.on('warn', (message) => {
      console.warn('[WARN]', message);
    });

    this.client.on('shardReady', (shardId) => {
      console.log(`Shard ${shardId} is ready`);
      this.sendHeartbeat();
    });

    this.client.on('shardError', (error, shardId) => {
      console.error(`Shard ${shardId} encountered an error:`, error);
    });

    this.client.on('shardDisconnect', (event, shardId) => {
      console.log(`Shard ${shardId} disconnected:`, event);
    });

    this.client.on('shardReconnecting', (shardId) => {
      console.log(`Shard ${shardId} is reconnecting`);
    });

    this.client.on('shardResume', (shardId, replayedEvents) => {
      console.log(`Shard ${shardId} resumed, replayed ${replayedEvents} events`);
      this.sendHeartbeat();
    });

    // Start periodic checks
    setInterval(() => this.checkGuilds(), 5000);
    // Start heartbeat with longer interval
    setInterval(() => this.sendHeartbeat(), this.HEARTBEAT_INTERVAL);
  }

  /**
   * Initializes guilds by fetching their members
   * @private
   * @returns {Promise<void>}
   */
  private async initializeGuilds() {
    const configs = await prisma.guildConfig.findMany();
    for (const config of configs) {
      const guild = this.client.guilds.cache.get(config.guildId);
      if (!guild) {
        continue;
      }

      try {
        await guild.members.fetch();
      } catch (error) {
        console.error('Error during initial member fetch:', error);
      }
    }
  }

  /**
   * Checks all guilds for role updates
   * @private
   * @returns {Promise<void>}
   */
  private async checkGuilds() {
    if (this.processingPromise) return;

    this.processingPromise = (async () => {
      try {
        const configs = await prisma.guildConfig.findMany();
        for (const config of configs) {
          await this.processGuild(config);
        }
      } catch (error) {
        console.error('Error in main processing:', error);
      }
    })();

    await this.processingPromise;
    this.processingPromise = null;
  }

  /**
   * Processes a single guild for role updates
   * @private
   * @param {GuildConfig} config - The guild configuration
   * @returns {Promise<void>}
   */
  private async processGuild(config: GuildConfig) {
    const guild = this.client.guilds.cache.get(config.guildId);
    if (!guild) {
      return;
    }

    const role = guild.roles.cache.get(config.roleId);
    if (!role) {
      return;
    }

    const logChannel = config.logChannelId 
      ? guild.channels.cache.get(config.logChannelId) as TextChannel | undefined
      : null;

    if (config.logChannelId && !logChannel) {
      return;
    }
    
    // Fetch latest member data
    await guild.members.fetch();
    const members = guild.members.cache;

    const memberGuildMap = await this.fetchMemberGuildData(guild.id);
    const roleChanges = await this.processMembers(members, memberGuildMap, config);

    if (roleChanges.length > 0 && logChannel) {
      await this.sendRoleChangeLog(logChannel, roleChanges, role);
    }
  }

  /**
   * Fetches guild data for all members in a guild
   * @private
   * @param {string} guildId - The ID of the guild to fetch data for
   * @returns {Promise<Map<string, GuildData>>} Map of member IDs to their guild data
   */
  private async fetchMemberGuildData(guildId: string): Promise<Map<string, GuildData>> {
    const memberGuildMap = new Map<string, GuildData>();
    let after = '0';
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await this.client.rest.get(
          `/guilds/${guildId}/members?limit=1000&after=${after}`
        );
        
        const guildData = response as GuildData[];
        
        if (guildData.length === 0) {
          hasMore = false;
        } else {
          for (const member of guildData) {
            memberGuildMap.set(member.user.id, member);
          }
          after = guildData[guildData.length - 1].user.id;
          hasMore = guildData.length === 1000;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error during pagination:', error);
        hasMore = false;
      }
    }

    return memberGuildMap;
  }

  /**
   * Processes members to determine role changes needed
   * @private
   * @param {Map<string, GuildMember>} members - Map of member IDs to their GuildMember objects
   * @param {Map<string, GuildData>} memberGuildMap - Map of member IDs to their guild data
   * @param {GuildConfig} config - The guild configuration
   * @returns {Promise<RoleChange[]>} Array of role changes to be applied
   */
  private async processMembers(
    members: Map<string, GuildMember>,
    memberGuildMap: Map<string, GuildData>,
    config: GuildConfig
  ): Promise<RoleChange[]> {
    const roleChanges: RoleChange[] = [];
    let processedCount = 0;
    let errorCount = 0;

    for (const [memberId, member] of members) {
      try {
        const memberData = memberGuildMap.get(memberId);
        const currentGuildId = memberData?.user?.primary_guild?.identity_guild_id;
        
        const shouldHaveRole = currentGuildId === config.guildId;
        const hasRole = member.roles.cache.has(config.roleId);

        if (shouldHaveRole && !hasRole) {
          await member.roles.add(config.roleId);
          roleChanges.push({ type: 'add', member });
        } else if (!shouldHaveRole && hasRole) {
          await member.roles.remove(config.roleId);
          roleChanges.push({ type: 'remove', member });
        }

        processedCount++;
      } catch (error) {
        console.error(`Error processing member ${memberId}:`, error);
        errorCount++;
        processedCount++;
      }
    }

    return roleChanges;
  }

  /**
   * Sends a log message about role changes to a channel
   * @private
   * @param {TextChannel} channel - The channel to send the log to
   * @param {RoleChange[]} changes - Array of role changes to log
   * @param {Role} role - The role being updated
   * @returns {Promise<void>}
   */
  private async sendRoleChangeLog(channel: TextChannel, changes: RoleChange[], role: Role) {
    try {
      const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('Role Updates')
        .setDescription('The following role changes were made:')
        .setTimestamp();

      const added = changes.filter(c => c.type === 'add');
      const removed = changes.filter(c => c.type === 'remove');

      if (added.length > 0) {
        embed.addFields({
          name: `✅ Added ${role.name} Role`,
          value: added.map(c => `• ${c.member.displayName}`).join('\n')
        });
      }

      if (removed.length > 0) {
        embed.addFields({
          name: `❌ Removed ${role.name} Role`,
          value: removed.map(c => `• ${c.member.displayName}`).join('\n')
        });
      }

      // @ts-ignore - Type mismatch between discord.js and discord-api-types versions
      await channel.send({ embeds: [embed] });
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === 50001) {
        return;
      }
      console.error('Error sending role change log:', error);
    }
  }

  /**
   * Sends a heartbeat to indicate the bot is alive
   * @private
   * @returns {Promise<void>}
   */
  private async sendHeartbeat() {
    const now = Date.now();
    // Prevent sending heartbeats too frequently
    if (now - this.lastHeartbeat < this.HEARTBEAT_DEBOUNCE) {
      return;
    }
    this.lastHeartbeat = now;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        console.error('Heartbeat failed:', response.status);
      }
    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  }

  /**
   * Gets all guilds the bot is in
   * @returns {Guild[]} Array of guilds
   */
  public getGuilds(): Guild[] {
    if (!this.client.isReady()) {
      return [];
    }
    return Array.from(this.client.guilds.cache.values());
  }

  /**
   * Verifies if a Discord token is valid
   * @private
   * @param {string} token - The token to verify
   * @returns {Promise<boolean>} Whether the token is valid
   */
  private async verifyToken(token: string): Promise<boolean> {
    // Check cache first
    if (this.tokenVerificationCache && 
        Date.now() - this.tokenVerificationCache.timestamp < this.TOKEN_CACHE_DURATION) {
      console.log('Using cached token verification result');
      return this.tokenVerificationCache.isValid;
    }

    try {
      const response = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
          Authorization: `Bot ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Token verification successful. Bot username:', data.username);
        // Cache the successful result
        this.tokenVerificationCache = {
          isValid: true,
          timestamp: Date.now(),
        };
        return true;
      } else if (response.status === 429) {
        // Rate limited - use cached result if available, otherwise assume valid
        console.warn('Rate limited during token verification. Using cached result if available.');
        if (this.tokenVerificationCache) {
          return this.tokenVerificationCache.isValid;
        }
        // If no cache, assume valid to prevent blocking the bot
        return true;
      } else {
        console.error('Token verification failed:', response.status, response.statusText);
        // Cache the failed result
        this.tokenVerificationCache = {
          isValid: false,
          timestamp: Date.now(),
        };
        return false;
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      // On error, use cached result if available, otherwise assume valid
      if (this.tokenVerificationCache) {
        return this.tokenVerificationCache.isValid;
      }
      // If no cache, assume valid to prevent blocking the bot
      return true;
    }
  }

  /**
   * Attempts to log in with the provided token
   * @private
   * @param {string} token - The token to use for login
   * @param {number} [attempt=1] - The current attempt number
   * @returns {Promise<void>}
   */
  private async attemptLogin(token: string, attempt: number = 1): Promise<void> {
    try {
      console.log(`Attempting to login (attempt ${attempt}/${this.MAX_RETRIES})...`);
      await this.client.login(token);
      console.log('Login successful');
    } catch (error) {
      console.error(`Login attempt ${attempt} failed:`, error);
      
      if (attempt < this.MAX_RETRIES) {
        console.log(`Retrying in ${this.RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.attemptLogin(token, attempt + 1);
      }
      
      throw new Error('Failed to login after maximum retries');
    }
  }

  /**
   * Starts the bot service
   * @returns {Promise<void>}
   */
  public async start() {
    // If we have a recent initialization error, don't try to start again immediately
    if (this.initializationError && Date.now() - this.lastInitializationAttempt < this.INITIALIZATION_COOLDOWN) {
      throw this.initializationError;
    }

    if (this.isInitializing) {
      return this.readyPromise;
    }

    if (this.client.isReady()) {
      return Promise.resolve();
    }

    this.isInitializing = true;
    this.lastInitializationAttempt = Date.now();
    this.initializationError = null;

    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      this.isInitializing = false;
      this.initializationError = new Error('Discord bot token not found');
      throw this.initializationError;
    }

    try {
      await this.attemptLogin(token);
      
      // Wait for the ready event with a timeout
      await Promise.race([
        this.readyPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Bot initialization timed out. Please try again in a few moments.')), this.LOGIN_TIMEOUT)
        )
      ]);

      // Fetch all guilds after ready
      console.log('Fetching guilds...');
      await this.client.guilds.fetch();
      console.log(`Fetched ${this.client.guilds.cache.size} guilds`);

      // Initialize guilds
      await this.initializeGuilds();
      
      this.isInitializing = false;
      return Promise.resolve();
    } catch (error) {
      this.isInitializing = false;
      this.initializationError = error instanceof Error ? error : new Error('Unknown error during bot initialization');
      console.error('Failed to start bot:', this.initializationError);
      throw this.initializationError;
    }
  }

  /**
   * Checks if the bot is logged in
   * @returns {boolean} Whether the bot is logged in
   */
  public isLoggedIn(): boolean {
    return this.client.isReady() && !this.initializationError;
  }

  // Update fetchGuilds method
  async fetchGuilds(): Promise<Guild[]> {
    if (!this.client.isReady()) {
      throw new Error('Bot is not ready');
    }

    try {
      const guilds = await this.client.guilds.fetch();
      const guildArray = await Promise.all(
        Array.from(guilds.values()).map(guild => guild.fetch())
      );
      
      // Cache guild data
      this.guildCache = new Map(
        guildArray.map(guild => [
          guild.id,
          {
            data: guild,
            timestamp: Date.now()
          }
        ])
      );

      return guildArray;
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        const endpoint = 'guilds';
        const cached = this.rateLimitCache.get(endpoint);
        if (cached && cached.resetAt > Date.now()) {
          await new Promise(resolve => setTimeout(resolve, cached.resetAt - Date.now()));
          return this.fetchGuilds();
        }
      }
      throw error;
    }
  }

  // Update fetchGuild method
  async fetchGuild(guildId: string): Promise<Guild | null> {
    if (!this.client.isReady()) {
      throw new Error('Bot is not ready');
    }

    try {
      const guild = await this.client.guilds.fetch(guildId);
      
      // Cache guild data
      this.guildCache.set(guildId, {
        data: guild,
        timestamp: Date.now()
      });

      return guild;
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        const endpoint = `guilds/${guildId}`;
        const cached = this.rateLimitCache.get(endpoint);
        if (cached && cached.resetAt > Date.now()) {
          await new Promise(resolve => setTimeout(resolve, cached.resetAt - Date.now()));
          return this.fetchGuild(guildId);
        }
      }
      return null;
    }
  }

  // Update fetchGuildMembers method
  async fetchGuildMembers(guildId: string): Promise<GuildMember[]> {
    if (!this.client.isReady()) {
      throw new Error('Bot is not ready');
    }

    try {
      const guild = await this.client.guilds.fetch(guildId);
      const members = await guild.members.fetch();
      
      // Cache member data
      this.memberCache.set(guildId, {
        data: Array.from(members.values()),
        timestamp: Date.now()
      });

      return Array.from(members.values());
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        const endpoint = `guilds/${guildId}/members`;
        const cached = this.rateLimitCache.get(endpoint);
        if (cached && cached.resetAt > Date.now()) {
          await new Promise(resolve => setTimeout(resolve, cached.resetAt - Date.now()));
          return this.fetchGuildMembers(guildId);
        }
      }
      throw error;
    }
  }

  /**
   * Gets the bot's user ID
   * @returns {string | null} The bot's user ID, or null if not logged in
   */
  public getBotUserId(): string | null {
    return this.client.user?.id || null;
  }

  /**
   * Gets the bot's status information
   * @returns {Object} Bot status information
   */
  public getStatusInfo() {
    return {
      status: this.client.isReady() ? 'ready' : 'not_ready',
      shards: this.client.shard?.count || 1,
      guilds: this.client.guilds.cache.size,
      uptime: this.client.uptime || 0,
      ping: this.client.ws.ping,
      lastHeartbeat: this.lastHeartbeat,
      isInitializing: this.isInitializing,
      initializationError: this.initializationError?.message || null
    };
  }

  /**
   * Gets the bot's uptime in milliseconds
   * @returns {number} Bot uptime in milliseconds
   */
  public getUptime(): number {
    return this.client.uptime || 0;
  }

  /**
   * Gets the bot's WebSocket ping in milliseconds
   * @returns {number} Bot WebSocket ping in milliseconds
   */
  public getPing(): number {
    return this.client.ws.ping;
  }

  /**
   * Gets the number of guilds the bot is in
   * @returns {number} Number of guilds
   */
  public getGuildCount(): number {
    return this.client.guilds.cache.size;
  }

  /**
   * Gets the number of shards the bot is using
   * @returns {number} Number of shards
   */
  public getShardCount(): number {
    return this.client.shard?.count || 1;
  }
}

export const botService = new BotService(); 