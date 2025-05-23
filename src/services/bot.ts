import { Client, GatewayIntentBits } from 'discord.js';
import { prisma } from '@/lib/prisma';

class BotService {
  private client: Client;
  private processingPromise: Promise<void> | null = null;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('ready', async () => {
      console.log(`Logged in as ${this.client.user?.tag}`);
      await this.initializeGuilds();
    });

    // Start periodic checks
    setInterval(() => this.checkGuilds(), 5000);
  }

  private async initializeGuilds() {
    const configs = await prisma.guildConfig.findMany();
    for (const config of configs) {
      const guild = this.client.guilds.cache.get(config.guildId);
      if (!guild) {
        console.error(`Guild ${config.guildId} not found`);
        continue;
      }

      try {
        console.log(`Fetching initial member list for ${guild.name}...`);
        await guild.members.fetch();
        console.log(`Successfully cached ${guild.members.cache.size} members`);
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

  private async processGuild(config: any) {
    const guild = this.client.guilds.cache.get(config.guildId);
    if (!guild) {
      console.error(`Guild ${config.guildId} not found`);
      return;
    }

    const representorsRole = guild.roles.cache.get(config.representorsRoleId);
    if (!representorsRole) {
      console.error(`Representors role (${config.representorsRoleId}) not found in guild`);
      return;
    }

    const logChannel = config.logChannelId 
      ? guild.channels.cache.get(config.logChannelId)
      : null;

    if (config.logChannelId && !logChannel) {
      console.error(`Log channel (${config.logChannelId}) not found`);
      return;
    }

    console.log(`Processing members for guild ${guild.name}...`);
    
    const members = guild.members.cache;
    console.log(`Found ${members.size} members in cache`);

    const memberGuildMap = await this.fetchMemberGuildData(guild.id);
    const roleChanges = await this.processMembers(members, memberGuildMap, config);

    if (roleChanges.length > 0 && logChannel) {
      await this.sendRoleChangeLog(logChannel, roleChanges);
    }
  }

  private async fetchMemberGuildData(guildId: string) {
    const memberGuildMap = new Map();
    let after = '0';
    let hasMore = true;

    while (hasMore) {
      try {
        const guildData = await this.client.rest.get(
          `/guilds/${guildId}/members?limit=1000&after=${after}`
        );
        
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

  private async processMembers(members: any, memberGuildMap: Map<string, any>, config: any) {
    const roleChanges = [];
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
          console.log(`✅ ${member.displayName}: Added Representors role (guild: ${currentGuildId})`);
          roleChanges.push({ type: 'add', member });
        } else if (!shouldHaveRole && hasRole) {
          await member.roles.remove(config.representorsRoleId);
          console.log(`❌ ${member.displayName}: Removed Representors role (guild: ${currentGuildId})`);
          roleChanges.push({ type: 'remove', member });
        } else {
          console.log(`• ${member.displayName}: No role change needed (guild: ${currentGuildId})`);
        }

        processedCount++;
        if (processedCount % 10 === 0) {
          console.log(`Progress: ${processedCount}/${members.size} members processed (${errorCount} errors)`);
        }
      } catch (error) {
        console.error(`Error processing member ${memberId}:`, error);
        errorCount++;
        processedCount++;
      }
    }

    return roleChanges;
  }

  private async sendRoleChangeLog(channel: any, changes: any[]) {
    const embed = {
      color: 0x2F3136,
      title: 'Role Updates',
      description: 'The following role changes were made:',
      timestamp: new Date().toISOString(),
      fields: []
    };

    const added = changes.filter(c => c.type === 'add');
    const removed = changes.filter(c => c.type === 'remove');

    if (added.length > 0) {
      embed.fields.push({
        name: '✅ Added Representors Role',
        value: added.map(c => `• ${c.member.displayName}`).join('\n')
      });
    }

    if (removed.length > 0) {
      embed.fields.push({
        name: '❌ Removed Representors Role',
        value: removed.map(c => `• ${c.member.displayName}`).join('\n')
      });
    }

    await channel.send({ embeds: [embed] });
  }

  public async start() {
    await this.client.login(process.env.DISCORD_TOKEN);
  }
}

export const botService = new BotService(); 