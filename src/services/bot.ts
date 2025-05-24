import { Client, GatewayIntentBits, Guild, GuildMember, TextChannel, EmbedBuilder, MessageCreateOptions, APIEmbed, DiscordAPIError } from 'discord.js';
import { prisma } from '@/lib/prisma';

interface GuildData {
  user: {
    id: string;
    primary_guild?: {
      identity_guild_id: string;
    };
  };
}

interface RoleChange {
  type: 'add' | 'remove';
  member: GuildMember;
}

interface GuildConfig {
  guildId: string;
  representorsRoleId: string;
  logChannelId: string | null;
}

class BotService {
  public client: Client;
  private processingPromise: Promise<void> | null = null;
  private readyPromise: Promise<void>;
  private readyResolve: (() => void) | null = null;
  private readyReject: ((error: Error) => void) | null = null;
  private readonly LOGIN_TIMEOUT = 30000; // Reduced to 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // Reduced to 2 seconds
  private tokenVerificationCache: {
    isValid: boolean;
    timestamp: number;
  } | null = null;
  private readonly TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private isInitializing: boolean = false;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
      ],
      rest: {
        timeout: 15000, // Reduced to 15 seconds
      },
    });

    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });

    this.setupEventHandlers();
  }

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

    this.client.on('debug', (message) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG]', message);
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
    // Start heartbeat
    setInterval(() => this.sendHeartbeat(), 30000);
  }

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

  private async processGuild(config: GuildConfig) {
    const guild = this.client.guilds.cache.get(config.guildId);
    if (!guild) {
      return;
    }

    const representorsRole = guild.roles.cache.get(config.representorsRoleId);
    if (!representorsRole) {
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
      await this.sendRoleChangeLog(logChannel, roleChanges);
    }
  }

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
        const hasRole = member.roles.cache.has(config.representorsRoleId);

        if (shouldHaveRole && !hasRole) {
          await member.roles.add(config.representorsRoleId);
          roleChanges.push({ type: 'add', member });
        } else if (!shouldHaveRole && hasRole) {
          await member.roles.remove(config.representorsRoleId);
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

  private async sendRoleChangeLog(channel: TextChannel, changes: RoleChange[]) {
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
          name: '✅ Added Representors Role',
          value: added.map(c => `• ${c.member.displayName}`).join('\n')
        });
      }

      if (removed.length > 0) {
        embed.addFields({
          name: '❌ Removed Representors Role',
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

  private async sendHeartbeat() {
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

  public getGuilds(): Guild[] {
    if (!this.client.isReady()) {
      return [];
    }
    return Array.from(this.client.guilds.cache.values());
  }

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

  public async start() {
    if (this.isInitializing) {
      return this.readyPromise;
    }

    if (this.client.isReady()) {
      return Promise.resolve();
    }

    this.isInitializing = true;
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      throw new Error('Discord bot token not found');
    }

    try {
      await this.attemptLogin(token);
      
      // Wait for the ready event with a timeout
      await Promise.race([
        this.readyPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Bot initialization timed out')), this.LOGIN_TIMEOUT)
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
      console.error('Failed to start bot:', error);
      throw error;
    }
  }

  public isLoggedIn(): boolean {
    return this.client.isReady();
  }
}

export const botService = new BotService(); 