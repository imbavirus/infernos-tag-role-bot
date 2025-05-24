import { Client, EmbedBuilder } from 'discord.js';
const client = new Client({ 
  intents: [
    'Guilds', 
    'GuildMembers',
    'MessageContent'
  ] 
});

const roleId = '1371885877344604210';
const guildId = '205381135562309632';
const logChannelId = null; // Optional: Set to null or a channel ID
let processingPromise = null;

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));


// Helper function to create role change log message
const createRoleChangeLog = (changes) => {
  if (changes.length === 0) return null;
  
  const embed = new EmbedBuilder()
    .setColor('#2F3136')
    .setTitle('Role Updates')
    .setDescription('The following role changes were made:')
    .setTimestamp();

  // Group changes by type (added/removed)
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
    console.log('\n=== Guild Settings ===');
    console.log(`Server Name: ${guild.name}`);
    console.log(`Verification Level: ${guild.verificationLevel}`);
    console.log(`Member Count: ${guild.memberCount}`);
    console.log(`Member Screening: ${guild.members.cache.first()?.guild.features.includes('MEMBER_VERIFICATION_GATE_ENABLED') ? 'Enabled' : 'Disabled'}`);
    console.log(`Manual Approval: ${guild.features.includes('MEMBER_VERIFICATION_MANUAL_APPROVAL') ? 'Enabled' : 'Disabled'}`);
    
    // Try to get the user directly
    console.log('\n=== Checking User ===');
    try {
      const user = await client.users.fetch('1257946587288698900');
      console.log('\n-----------------------------------');
      console.log(`Username: ${user.tag}`);
      console.log(`ID: ${user.id}`);
      console.log(`Created at: ${user.createdAt.toISOString()}`);
      console.log(`Bot: ${user.bot}`);
      console.log('-----------------------------------');

      // Check guild features and settings
      console.log('\n=== Guild Features ===');
      console.log('Enabled Features:');
      guild.features.forEach(feature => {
        console.log(`- ${feature}`);
      });

      // Check if there are any verification channels
      const verificationChannels = guild.channels.cache.filter(channel => 
        channel.name.toLowerCase().includes('verify') || 
        channel.name.toLowerCase().includes('verification') ||
        channel.name.toLowerCase().includes('welcome')
      );

      if (verificationChannels.size > 0) {
        console.log('\n=== Verification Channels ===');
        verificationChannels.forEach(channel => {
          console.log(`\n-----------------------------------`);
          console.log(`Name: ${channel.name}`);
          console.log(`ID: ${channel.id}`);
          console.log(`Type: ${channel.type}`);
          console.log(`Position: ${channel.position}`);
        });
      }

      // Check onboarding settings
      try {
        const onboarding = await guild.fetchOnboarding();
        console.log('\n=== Onboarding Settings ===');
        console.log(`Enabled: ${onboarding.enabled}`);
        console.log(`Prompts: ${onboarding.prompts.length}`);
        console.log(`Default Channels: ${onboarding.defaultChannels.length}`);
        
        if (onboarding.prompts.length > 0) {
          console.log('\nOnboarding Prompts:');
          onboarding.prompts.forEach(prompt => {
            console.log(`\n-----------------------------------`);
            console.log(`Title: ${prompt.title}`);
            console.log(`Type: ${prompt.type}`);
            console.log(`Required: ${prompt.required}`);
          });
        }
      } catch (onboardingError) {
        console.log('Error fetching onboarding settings:', onboardingError.message);
      }

    } catch (error) {
      console.log('Could not fetch user:', error.message);
    }

  } catch (error) {
    console.error('Error checking guild settings:', error);
  }
});

// Set up event listeners for join attempts
client.on('guildMemberAdd', async member => {
  if (member.user.id === '1257946587288698900') {
    console.log('\n=== Target User Join Attempt ===');
    console.log(`Username: ${member.user.tag}`);
    console.log(`ID: ${member.user.id}`);
    console.log(`Joined At: ${member.joinedAt.toISOString()}`);
    console.log(`Pending: ${member.pending}`);
  }
});

// Listen for any guild member updates
client.on('guildMemberUpdate', (oldMember, newMember) => {
  if (newMember.user.id === '1257946587288698900') {
    console.log('\n=== Target User Status Update ===');
    console.log(`Username: ${newMember.user.tag}`);
    console.log(`Pending Status Changed: ${oldMember.pending} -> ${newMember.pending}`);
    console.log(`Roles Changed: ${oldMember.roles.cache.size} -> ${newMember.roles.cache.size}`);
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
      const role = guild.roles.cache.get(roleId);
      if (!role) {
        console.error(`Role (${roleId}) not found in guild. Please verify the role ID.`);
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

      // Get all members from cache
      const members = guild.members.cache;

      // Get all member IDs
      const memberIds = Array.from(members.keys());
      
      // Make REST calls with pagination to get all members' guild data
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
          }
          // Add a small delay between pagination requests
          await delay(100);
        } catch (error) {
          console.error('Error during pagination:', error);
          hasMore = false;
        }
      }
      
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
          const hasRole = member.roles.cache.has(roleId);

          if (shouldHaveRole && !hasRole) {
            await member.roles.add(roleId);
            roleChanges.push({ type: 'add', member });
          } else if (!shouldHaveRole && hasRole) {
            await member.roles.remove(roleId);
            roleChanges.push({ type: 'remove', member });
          }

          processedCount++;
        } catch (error) {
          console.error(`Error processing member ${memberId}:`, error);
          errorCount++;
          processedCount++;
        }
      }

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