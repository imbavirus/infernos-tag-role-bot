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

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
      ],
    });

    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve;
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('ready', async () => {
      if (this.readyResolve) {
        this.readyResolve();
      }
      await this.initializeGuilds();
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

  public async start() {
    await this.client.login(process.env.DISCORD_TOKEN);
    return this.readyPromise;
  }

  public isLoggedIn(): boolean {
    return this.client.isReady();
  }

  public getGuilds(): Guild[] {
    return Array.from(this.client.guilds.cache.values());
  }
}

export const botService = new BotService(); 