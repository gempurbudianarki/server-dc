const { Client, GatewayIntentBits, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { BOT_TOKEN, GUILD_ID } = require('../config');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const ROLES_SPEC = [
  { name: '👑 ︱ [CCA] Root Admin', color: '#990000', hoist: true, mentionable: true, permissions: [PermissionFlagsBits.Administrator] },
  { name: '🛡️ ︱ [CCA] Cyber Sentinel', color: '#0066CC', hoist: true, mentionable: true, permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers, PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.ManageThreads, PermissionFlagsBits.ViewAuditLog] },
  { name: '💻 ︱ [CCA] Senior Researcher', color: '#009966', hoist: true, mentionable: true, permissions: [PermissionFlagsBits.PrioritySpeaker, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageEvents] },
  { name: '🚩 ︱ [CCA] CTF Operator', color: '#9933FF', hoist: true, mentionable: true, permissions: [] },
  { name: '🟢 ︱ [CCA] Verified Member', color: '#00CCCC', hoist: true, mentionable: true, permissions: [] }
];

const CATEGORIES_SPEC = [
  {
    name: '╭━━⋙ ⚡ 𝖦𝖤𝖱𝖡𝖠𝖭𝖦 // 𝖦𝖠𝖳𝖤𝖶𝖠𝖸 ⋘━━╮',
    keyword: 'GERBANG',
    channels: [
      { name: '✦・📜・aturan-terminal', keyword: 'rules', type: ChannelType.GuildText, readonly: true, special: 'rules' },
      { name: '✦・📢・pengumuman-resmi', keyword: 'announcements', type: ChannelType.GuildText, readonly: true },
      { name: '✦・🔒・verifikasi-anggota', keyword: 'verification', type: ChannelType.GuildText, readonly: true, special: 'verification' },
      { name: '✦・👋・log-akses-masuk', keyword: 'access-logs', type: ChannelType.GuildText, readonly: true }
    ]
  },
  {
    name: '╭━━⋙ 🚨 𝖢𝖸𝖡𝖤𝖱 𝖨𝖭𝖳𝖤𝖫 // 𝖠𝖭𝖢𝖠𝖬𝖠𝖭 ⋘━━╮',
    keyword: 'INTEL',
    channels: [
      { name: '✦・🗞️・feed-berita-cyber', keyword: 'threat', type: ChannelType.GuildText, readonly: true },
      { name: '✦・⚠️・info-cve-zero-day', keyword: 'cve', type: ChannelType.GuildText, readonly: true },
      { name: '✦・📆・agenda-kegiatan', keyword: 'events', type: ChannelType.GuildText, readonly: true }
    ]
  },
  {
    name: '╭━━⋙ 💬 𝖭𝖤𝖳𝖶𝖮𝖱𝖪 // 𝖫𝖮𝖴𝖭𝖦𝖤 𝖡𝖤𝖡𝖠𝖲 ⋘━━╮',
    keyword: 'NETWORK',
    channels: [
      { name: '✦・💬・diskusi-bebas', keyword: 'main-frame', type: ChannelType.GuildText },
      { name: '✦・❓・tanya-jawab-teknis', keyword: 'helpdesk', type: ChannelType.GuildText },
      { name: '✦・💡・showcase-riset', keyword: 'research', type: ChannelType.GuildText },
      { name: '✦・🤖・konsol-bot', keyword: 'bot', type: ChannelType.GuildText }
    ]
  },
  {
    name: '╭━━⋙ 🛡️ 𝖳𝖠𝖢𝖳𝖨𝖢𝖠𝖫 𝖫𝖠𝖡𝖲 // 𝖣𝖮𝖬𝖠𝖨𝖭 ⋘━━╮',
    keyword: 'TACTICAL',
    channels: [
      { name: '✦・🌐・web-exploitation', keyword: 'web', type: ChannelType.GuildText },
      { name: '✦・🛰️・cloud-network-sec', keyword: 'cloud', type: ChannelType.GuildText },
      { name: '✦・🔍・dfir-forensics', keyword: 'forensics', type: ChannelType.GuildText },
      { name: '✦・🧩・reverse-engineering', keyword: 'reverse', type: ChannelType.GuildText },
      { name: '✦・🔴・red-team-ops', keyword: 'red-team', type: ChannelType.GuildText },
      { name: '✦・🔵・blue-team-soc', keyword: 'blue-team', type: ChannelType.GuildText }
    ]
  },
  {
    name: '╭━━⋙ ⚔️ 𝖢𝖳𝖥 𝖠𝖱𝖤𝖭𝖠 // 𝖮𝖯𝖤𝖱𝖠𝖲𝖨 ⋘━━╮',
    keyword: 'CTF',
    channels: [
      { name: '✦・🚩・ctf-radar', keyword: 'radar', type: ChannelType.GuildText },
      { name: '✦・🤝・rekrutmen-tim', keyword: 'recruitment', type: ChannelType.GuildText },
      { name: '✦・📝・writeup-jawaban', keyword: 'writeups', type: ChannelType.GuildText },
      { name: '✦・🧪・lab-virtual', keyword: 'labs', type: ChannelType.GuildText }
    ]
  },
  {
    name: '╭━━⋙ 🎯 𝖡𝖮𝖴𝖭𝖳𝖸 // 𝖫𝖠𝖯𝖮𝖱𝖠𝖭 ⋘━━╮',
    keyword: 'BOUNTY',
    channels: [
      { name: '✦・🗞️・info-bug-bounty', keyword: 'info-bug-bounty', type: ChannelType.GuildText, readonly: true },
      { name: '✦・🎯・diskusi-bounty', keyword: 'bounty-lounge', type: ChannelType.GuildText },
      { name: '✦・🏆・hall-of-fame', keyword: 'hall-of-fame', type: ChannelType.GuildText, readonly: true },
      { name: '✦・📜・responsible-disclosure', keyword: 'disclosures', type: ChannelType.GuildText, readonly: true }
    ]
  },
  {
    name: '╭━━⋙ 📚 𝖣𝖠𝖳𝖠𝖡𝖠𝖲𝖤 // 𝖪𝖭𝖮𝖶𝖫𝖤𝖣𝖦𝖤 ⋘━━╮',
    keyword: 'DATABASE',
    channels: [
      { name: '✦・🗺️・panduan-belajar', keyword: 'roadmaps', type: ChannelType.GuildText, readonly: true },
      { name: '✦・🛠️・berbagi-tools', keyword: 'tools', type: ChannelType.GuildText },
      { name: '✦・📄・cheatsheet-vault', keyword: 'cheatsheet', type: ChannelType.GuildText, readonly: true },
      { name: '✦・💼・loker-cyber', keyword: 'careers', type: ChannelType.GuildText }
    ]
  },
  {
    name: '╭━━⋙ 🎫 𝖧𝖤𝖫𝖯𝖣𝖤𝖲𝖪 // 𝖡𝖠𝖭𝖳𝖴𝖠𝖭 ⋘━━╮',
    keyword: 'HELPDESK',
    channels: [
      { name: '✦・🎟️・buat-tiket', keyword: 'ticket', type: ChannelType.GuildText, readonly: true, special: 'ticket' }
    ]
  },
  {
    name: '╭━━⋙ 👑 𝖱𝖮𝖮𝖳 𝖬𝖠𝖳𝖱𝖨𝖧 // 𝖨𝖭𝖳𝖤𝖱𝖭 ⋘━━╮',
    keyword: 'ROOT',
    staffOnly: true,
    channels: [
      { name: '✦・💬・ruang-pengurus', keyword: 'root-lounge', type: ChannelType.GuildText },
      { name: '✦・🚨・log-audit-soc', keyword: 'audit-logs', type: ChannelType.GuildText, readonly: true },
      { name: '✦・📂・arsip-transkrip', keyword: 'transcript', type: ChannelType.GuildText, readonly: true }
    ]
  },
  {
    name: '╭━━⋙ 🎧 𝖵𝖮𝖨𝖢𝖤 // 𝖢𝖮𝖬𝖬𝖲 ⋘━━╮',
    keyword: 'VOICE',
    channels: [
      { name: '🔊 Ruang Obrolan Audio', keyword: 'Lounge', type: ChannelType.GuildVoice },
      { name: '🎙️ Ruang Workshop', keyword: 'Briefing', type: ChannelType.GuildVoice },
      { name: '⚔️ CTF Tactical Room 1', keyword: 'Tactical Room 1', type: ChannelType.GuildVoice },
      { name: '⚔️ CTF Tactical Room 2', keyword: 'Tactical Room 2', type: ChannelType.GuildVoice }
    ]
  }
];

client.once('ready', async () => {
  console.log(`🤖 Aesthetic Builder logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    console.log(`🔨 Updating Read-Only Permissions for: ${guild.name} (${guild.id})`);

    const existingChannels = await guild.channels.fetch();

    // 1. Build Roles
    const createdRoles = {};
    for (const rSpec of ROLES_SPEC) {
      let role = guild.roles.cache.find(r => r.name.includes(rSpec.name.split('︱')[1].trim()));
      if (!role) {
        role = await guild.roles.create({
          name: rSpec.name,
          color: rSpec.color,
          hoist: rSpec.hoist,
          mentionable: rSpec.mentionable,
          permissions: rSpec.permissions || []
        });
      }
      createdRoles[rSpec.name] = role;
    }

    const everyoneRole = guild.roles.everyone;
    const verifiedRole = Object.values(createdRoles).find(r => r.name.includes('Verified Member'));
    const sentinelRole = Object.values(createdRoles).find(r => r.name.includes('Cyber Sentinel'));
    const adminRole = Object.values(createdRoles).find(r => r.name.includes('Root Admin'));

    // 2. Update Channel Permissions strictly
    for (const catSpec of CATEGORIES_SPEC) {
      let category = existingChannels.find(c => c.type === ChannelType.GuildCategory && (c.name.includes(catSpec.keyword) || c.name === catSpec.name));
      if (!category) continue;

      for (const chSpec of catSpec.channels) {
        let channel = existingChannels.find(c => c.parentId === category.id && (c.name.includes(chSpec.keyword) || c.name === chSpec.name));
        if (!channel) continue;

        const permissionOverwrites = [];
        if (catSpec.staffOnly) {
          permissionOverwrites.push(
            { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: sentinelRole.id, allow: [PermissionFlagsBits.ViewChannel] },
            { id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel] }
          );
        } else if (chSpec.readonly) {
          // Strictly Read-Only: Deny SendMessages for @everyone AND Verified Members
          permissionOverwrites.push(
            { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
            { id: verifiedRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }
          );
        } else {
          // Chattable channel: Allow SendMessages for Verified Members
          permissionOverwrites.push(
            { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
            { id: verifiedRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
          );
        }

        await channel.edit({ permissionOverwrites });
        console.log(`🔒 Permissions enforced (${chSpec.readonly ? 'READ-ONLY' : 'CHATTABLE'}): ${channel.name}`);
      }
    }

    console.log('✅ Read-Only Permissions Enforced Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating channel permissions:', err);
    process.exit(1);
  }
});

client.login(BOT_TOKEN);
