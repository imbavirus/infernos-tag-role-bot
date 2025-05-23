const Discord = require('discord.js');
const client = new Discord.Client({ 
  intents: [
    'Guilds', 
    'GuildMembers',
    'MessageContent'
  ] 
});

const representorsRoleId = '1371885877344604210';
const guildId = '205381135562309632';
const logChannelId = null; // Optional: Set to null or a channel ID
let processingPromise = null;

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to create role change log message
const createRoleChangeLog = (changes) => {
  if (changes.length === 0) return null;
  
  const embed = new Discord.EmbedBuilder()
    .setColor('#2F3136')
    .setTitle('Role Updates')
    .setDescription('The following role changes were made:')
    .setTimestamp();

  // Group changes by type (added/removed)
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

  return embed;
};

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  
  // Initial fetch of guild and members
  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    console.error(`Guild ${guildId} not found`);
    return;
  }
  
  try {
    console.log(`Fetching initial member list for ${guild.name}...`);
    await guild.members.fetch();
    console.log(`Successfully cached ${guild.members.cache.size} members`);
  } catch (error) {
    console.error('Error during initial member fetch:', error);
  }
});

// Check for guild changes periodically
setInterval(async () => {
  // Skip if we're still processing
  if (processingPromise) {
    return;
  }

  // Start new processing cycle
  processingPromise = (async () => {
    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        console.error(`Guild ${guildId} not found`);
        return;
      }

      // Verify the role exists
      const representorsRole = guild.roles.cache.get(representorsRoleId);
      if (!representorsRole) {
        console.error(`Representors role (${representorsRoleId}) not found in guild. Please verify the role ID.`);
        return;
      }

      // Get log channel if ID is provided
      let logChannel = null;
      if (logChannelId) {
        logChannel = guild.channels.cache.get(logChannelId);
        if (!logChannel) {
          console.error(`Log channel (${logChannelId}) not found. Please verify the channel ID.`);
          return;
        }
      }

      console.log(`Processing members for guild ${guild.name}...`);
      
      // Get all members from cache
      const members = guild.members.cache;
      console.log(`Found ${members.size} members in cache`);

      // Get all member IDs
      const memberIds = Array.from(members.keys());
      
      // Make REST calls with pagination to get all members' guild data
      console.log('Fetching guild data for all members...');
      const memberGuildMap = new Map();
      let after = '0';
      let hasMore = true;
      
      while (hasMore) {
        try {
          const guildData = await client.rest.get(`/guilds/${guildId}/members?limit=1000&after=${after}`);
          if (guildData.length === 0) {
            hasMore = false;
          } else {
            // Add members to map using their ID as key
            for (const member of guildData) {
              memberGuildMap.set(member.user.id, member);
            }
            after = guildData[guildData.length - 1].user.id;
            hasMore = guildData.length === 1000;
            console.log(`Fetched ${memberGuildMap.size} members so far...`);
          }
          // Add a small delay between pagination requests
          await delay(100);
        } catch (error) {
          console.error('Error during pagination:', error);
          hasMore = false;
        }
      }
      
      console.log(`Successfully fetched data for ${memberGuildMap.size} members`);
      
      // Update member cache
      let processedCount = 0;
      let errorCount = 0;
      const roleChanges = [];
      
      for (const [memberId, member] of members) {
        try {
          const memberData = memberGuildMap.get(memberId);
          const currentGuildId = memberData?.user?.primary_guild?.identity_guild_id;
          
          // Update roles based on current guild
          const shouldHaveRole = currentGuildId === guildId;
          const hasRole = member.roles.cache.has(representorsRoleId);

          if (shouldHaveRole && !hasRole) {
            await member.roles.add(representorsRoleId);
            console.log(`✅ ${member.displayName}: Added Representors role (guild: ${currentGuildId})`);
            roleChanges.push({ type: 'add', member });
          } else if (!shouldHaveRole && hasRole) {
            await member.roles.remove(representorsRoleId);
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
      console.log(`Completed processing all ${processedCount} members (${errorCount} errors)`);

      // Send role change log if there were any changes and a log channel is configured
      if (roleChanges.length > 0 && logChannel) {
        const logEmbed = createRoleChangeLog(roleChanges);
        if (logEmbed) {
          await logChannel.send({ embeds: [logEmbed] });
        }
      }
    } catch (error) {
      console.error('Error in main processing:', error);
    }
  })();

  // Wait for processing to complete
  await processingPromise;
  processingPromise = null;
}, 5000); // Check every 5 seconds

// Add global error handler
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  processingPromise = null;
});

client.login('MTM3MTg4OTkwNTgyNjc5MTQ0NQ.Ga8A7w.17kAjcBrbBRG2ec_bJ_zBem-_GEPhSC0gKjS6Y');