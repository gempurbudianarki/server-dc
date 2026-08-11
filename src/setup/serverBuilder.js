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
    name: '╭━━⋙ ⚡ 𝖲𝖸𝖲𝖳𝖤𝖬 𝖦𝖠𝖳𝖤𝖶𝖠𝖸 ⋘━━╮',
    keyword: 'SYSTEM',
    channels: [
      { name: '✦・📜・terminal-rules', keyword: 'rules', type: ChannelType.GuildText, readonly: true },
      { name: '✦・📢・announcements', keyword: 'announcements', type: ChannelType.GuildText, readonly: true },
      { name: '✦・🔒・verification', keyword: 'verification', type: ChannelType.GuildText, readonly: true, special: 'verification' },
      { name: '✦・👋・access-logs', keyword: 'access-logs', type: ChannelType.GuildText, readonly: true }
    ]
  },
  {
    name: '╭━━⋙ 🚨 𝖢𝖸𝖡𝖤𝖱 𝖨𝖭𝖳𝖤𝖫 ⋘━━╮',
    keyword: 'INTEL',
    channels: [
      { name: '✦・🗞️・threat-feeds', keyword: 'threat', type: ChannelType.GuildText, readonly: true },
      { name: '✦・⚠️・cve-zero-days', keyword: 'cve', type: ChannelType.GuildText, readonly: true },
      { name: '✦・📆・operation-events', keyword: 'events', type: ChannelType.GuildText, readonly: true }
    ]
  },
  {
    name: '╭━━⋙ 💬 𝖭𝖤𝖳𝖶𝖮𝖱𝖪 𝖫𝖮𝖴𝖭𝖦𝖤 ⋘━━╮',
    keyword: 'NETWORK',
    channels: [
      { name: '✦・💬・main-frame', keyword: 'main-frame', type: ChannelType.GuildText },
      { name: '✦・❓・helpdesk-debug', keyword: 'helpdesk', type: ChannelType.GuildText },
      { name: '✦・💡・research-showcase', keyword: 'research', type: ChannelType.GuildText },
      { name: '✦・🤖・bot-console', keyword: 'bot', type: ChannelType.GuildText }
    ]
  },
  {
    name: '╭━━⋙ 🛡️ 𝖳𝖠𝖢𝖳𝖨𝖢𝖠𝖫 𝖫𝖠𝖡𝖲 ⋘━━╮',
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
    name: '╭━━⋙ ⚔️ 𝖢𝖳𝖥 𝖠𝖱𝖤𝖭𝖠 ⋘━━╮',
    keyword: 'CTF',
    channels: [
      { name: '✦・🚩・ctf-radar', keyword: 'radar', type: ChannelType.GuildText },
      { name: '✦・🤝・squad-recruitment', keyword: 'recruitment', type: ChannelType.GuildText },
      { name: '✦・📝・flag-writeups', keyword: 'writeups', type: ChannelType.GuildText },
      { name: '✦・🧪・virtual-labs', keyword: 'labs', type: ChannelType.GuildText }
    ]
  },
  {
    name: '╭━━⋙ 🎯 𝖡𝖮𝖴𝖭𝖳𝖸 𝖧𝖴𝖭𝖳𝖨𝖭𝖦 ⋘━━╮',
    keyword: 'BOUNTY',
    channels: [
      { name: '✦・🎯・bounty-lounge', keyword: 'bounty-lounge', type: ChannelType.GuildText },
      { name: '✦・🏆・hall-of-fame', keyword: 'hall-of-fame', type: ChannelType.GuildText },
      { name: '✦・📜・disclosures', keyword: 'disclosures', type: ChannelType.GuildText }
    ]
  },
  {
    name: '╭━━⋙ 📚 𝖪𝖭𝖮𝖶𝖫𝖤𝖣𝖦𝖤 𝖵𝖠𝖴𝖫𝖳 ⋘━━╮',
    keyword: 'KNOWLEDGE',
    channels: [
      { name: '✦・🗺️・hacker-roadmaps', keyword: 'roadmaps', type: ChannelType.GuildText },
      { name: '✦・🛠️・arsenal-tools', keyword: 'tools', type: ChannelType.GuildText },
      { name: '✦・📄・cheatsheet-vault', keyword: 'cheatsheet', type: ChannelType.GuildText },
      { name: '✦・💼・cyber-careers', keyword: 'careers', type: ChannelType.GuildText }
    ]
  },
  {
    name: '╭━━⋙ 🎫 𝖧𝖤𝖫𝖯𝖣𝖤𝖲𝖪 𝖳𝖨𝖢𝖪𝖤𝖳 ⋘━━╮',
    keyword: 'TICKET',
    channels: [
      { name: '✦・🎟️・create-ticket', keyword: 'ticket', type: ChannelType.GuildText, readonly: true, special: 'ticket' }
    ]
  },
  {
    name: '╭━━⋙ 👑 𝖱𝖮𝖮𝖳 𝖬𝖠𝖳𝖱𝖨𝖧 ⋘━━╮',
    keyword: 'ROOT',
    staffOnly: true,
    channels: [
      { name: '✦・💬・root-lounge', keyword: 'root-lounge', type: ChannelType.GuildText },
      { name: '✦・🚨・soc-audit-logs', keyword: 'audit-logs', type: ChannelType.GuildText },
      { name: '✦・📂・transcript-vault', keyword: 'transcript', type: ChannelType.GuildText }
    ]
  },
  {
    name: '╭━━⋙ 🎧 𝖵𝖮𝖨𝖢𝖤 𝖢𝖮𝖬𝖬𝖲 ⋘━━╮',
    keyword: 'VOICE',
    channels: [
      { name: '🔊 Comms Lounge', keyword: 'Lounge', type: ChannelType.GuildVoice },
      { name: '🎙️ Briefing Room', keyword: 'Briefing', type: ChannelType.GuildVoice },
      { name: '⚔️ CTF Tactical Room 1', keyword: 'Tactical Room 1', type: ChannelType.GuildVoice },
      { name: '⚔️ CTF Tactical Room 2', keyword: 'Tactical Room 2', type: ChannelType.GuildVoice }
    ]
  }
];

client.once('ready', async () => {
  console.log(`🤖 Aesthetic Builder logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    console.log(`🔨 Updating server to Fancy Fonts for: ${guild.name} (${guild.id})`);

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
        console.log(`  ➕ Role created: ${role.name}`);
      } else {
        await role.setName(rSpec.name);
      }
      createdRoles[rSpec.name] = role;
    }

    const everyoneRole = guild.roles.everyone;
    const verifiedRole = Object.values(createdRoles).find(r => r.name.includes('Verified Member'));
    const sentinelRole = Object.values(createdRoles).find(r => r.name.includes('Cyber Sentinel'));
    const adminRole = Object.values(createdRoles).find(r => r.name.includes('Root Admin'));

    // 2. Build or Rename Categories & Channels
    for (const catSpec of CATEGORIES_SPEC) {
      let category = existingChannels.find(c => c.type === ChannelType.GuildCategory && (c.name.includes(catSpec.keyword) || c.name === catSpec.name));
      if (!category) {
        category = await guild.channels.create({
          name: catSpec.name,
          type: ChannelType.GuildCategory
        });
        console.log(`📂 Category created: ${category.name}`);
      } else {
        await category.setName(catSpec.name);
        console.log(`📂 Category renamed to Fancy Font: ${category.name}`);
      }

      for (const chSpec of catSpec.channels) {
        let channel = existingChannels.find(c => c.parentId === category.id && (c.name.includes(chSpec.keyword) || c.name === chSpec.name));
        if (!channel) {
          channel = existingChannels.find(c => c.name.includes(chSpec.keyword));
        }

        const permissionOverwrites = [];
        if (catSpec.staffOnly) {
          permissionOverwrites.push(
            { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: sentinelRole.id, allow: [PermissionFlagsBits.ViewChannel] },
            { id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel] }
          );
        } else if (chSpec.name.includes('verification') || chSpec.name.includes('terminal-rules')) {
          permissionOverwrites.push(
            { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }
          );
        } else {
          permissionOverwrites.push(
            { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
            { id: verifiedRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
          );
          if (chSpec.readonly) {
            permissionOverwrites.push(
              { id: verifiedRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }
            );
          }
        }

        if (!channel) {
          channel = await guild.channels.create({
            name: chSpec.name,
            type: chSpec.type,
            parent: category.id,
            permissionOverwrites
          });
          console.log(`  📜 Fancy Channel created: ${channel.name}`);

          if (chSpec.special === 'verification') {
            const embed = new EmbedBuilder()
              .setTitle('🛡️ CYBERSECURITY COMMUNITY OF ACEH // VERIFICATION MATRIX')
              .setDescription('```text\n[!] ACCESS RESTRICTED: UNVERIFIED OPERATOR DETECTED\n```\nSelamat datang di mainframe resmi **CCA (Cybersecurity Community of Aceh)**.\n\nUntuk mendapatkan akses penuh ke seluruh jaringan, channel, dan resource komunitas, silakan selesaikan verifikasi anti-bot dengan mengklik tombol di bawah ini.')
              .setColor(0x00F0FF)
              .setFooter({ text: 'CCA Security System v2.0 • Encrypted Protocol' });

            const btn = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('btn_verify')
                .setLabel('⚡ AUTHENTICATE OPERATOR')
                .setStyle(ButtonStyle.Success)
            );
            await channel.send({ embeds: [embed], components: [btn] });
          } else if (chSpec.special === 'ticket') {
            const embed = new EmbedBuilder()
              .setTitle('🎟️ CCA HELPDESK // PRIVATE SUPPORT TICKET')
              .setDescription('```text\n[+] SECURE DISPATCH TERMINAL\n```\nButuh bantuan teknis, laporan insiden, atau konsultasi khusus dengan Tim Pengurus & SOC Team CCA?\n\nKlik tombol **OPEN SUPPORT TICKET** di bawah untuk membuka saluran terenkripsi private bersama Tim Sentinel.')
              .setColor(0x0066FF)
              .setFooter({ text: 'CCA Dispatch System • SOC Team Active' });

            const btn = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('btn_open_ticket')
                .setLabel('🎟️ OPEN SUPPORT TICKET')
                .setStyle(ButtonStyle.Primary)
            );
            await channel.send({ embeds: [embed], components: [btn] });
          }
        } else {
          await channel.edit({ name: chSpec.name, parent: category.id, permissionOverwrites });
          console.log(`  📜 Fancy Channel renamed: ${channel.name}`);
        }
      }
    }

    console.log('✅ Fancy Unicode Font Server Builder Completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error building fancy server:', err);
    process.exit(1);
  }
});

client.login(BOT_TOKEN);
