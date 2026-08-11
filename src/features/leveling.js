const { EmbedBuilder } = require('discord.js');
const { db } = require('../db/database');

const xpCooldowns = new Map();

function getXpForLevel(level) {
  return level * 100 + (level - 1) * 50; // Formula: Level 1=100XP, Level 2=250XP, Level 3=450XP, etc.
}

function getProgressBar(current, target, length = 10) {
  const progress = Math.min(Math.max(current / target, 0), 1);
  const filledLength = Math.round(length * progress);
  const emptyLength = length - filledLength;
  return '█'.repeat(filledLength) + '░'.repeat(emptyLength);
}

const LEVEL_ROLES = [
  { level: 1, name: '🟢 ︱ [CCA] Script Kiddie' },
  { level: 5, name: '🔵 ︱ [CCA] Code Breaker' },
  { level: 10, name: '🟣 ︱ [CCA] Cyber Specialist' },
  { level: 25, name: '🔴 ︱ [CCA] Elite Hacker' },
  { level: 50, name: '👑 ︱ [CCA] Master Mind' }
];

async function handleMessageXP(message) {
  if (!message.guild || message.author.bot) return;

  const userId = message.author.id;
  const now = Date.now();

  // 60-second XP cooldown per user
  if (xpCooldowns.has(userId) && now - xpCooldowns.get(userId) < 60000) {
    return;
  }
  xpCooldowns.set(userId, now);

  const xpEarned = Math.floor(Math.random() * 11) + 15; // 15-25 XP

  db.get('SELECT xp, level FROM levels WHERE user_id = ?', [userId], async (err, row) => {
    let currentXp = (row ? row.xp : 0) + xpEarned;
    let currentLevel = row ? row.level : 1;
    let xpNeeded = getXpForLevel(currentLevel);

    let leveledUp = false;
    while (currentXp >= xpNeeded) {
      currentLevel++;
      leveledUp = true;
      xpNeeded = getXpForLevel(currentLevel);
    }

    db.run('INSERT OR REPLACE INTO levels (user_id, xp, level, last_xp) VALUES (?, ?, ?, ?)', [userId, currentXp, currentLevel, now]);

    if (leveledUp) {
      // Check role rewards
      const guild = message.guild;
      for (const rSpec of LEVEL_ROLES) {
        if (currentLevel >= rSpec.level) {
          const role = guild.roles.cache.find(r => r.name.includes(rSpec.name.split('︱')[1].trim()));
          if (role && !message.member.roles.cache.has(role.id)) {
            await message.member.roles.add(role).catch(() => {});
          }
        }
      }

      // Send Level Up Embed
      const embed = new EmbedBuilder()
        .setTitle('⚡ [LEVEL UP ALERT] // REPUTATION RANK UPGRADED')
        .setDescription(
          `\`\`\`text\n[+] LEVEL UP PROTOCOL EXECUTED\n[+] NEW RANK REACHED: LEVEL ${currentLevel}\n\`\`\`\n` +
          `Selamat **<@${userId}>**! Keaktifan Anda telah meningkatkan reputasi ke **Level ${currentLevel}**! 🛡️⚡`
        )
        .setColor(0x00F0FF)
        .setThumbnail(message.author.displayAvatarURL({ extension: 'png', size: 256 }))
        .setFooter({ text: 'CCA Leveling Matrix • Keep Hacking & Learning' })
        .setTimestamp();

      const channel = message.channel;
      await channel.send({ content: `🎉 Congratulations Operator <@${userId}>!`, embeds: [embed] }).catch(() => {});
    }
  });
}

async function handleRankCommand(interaction) {
  try {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const userId = targetUser.id;

    db.get('SELECT xp, level FROM levels WHERE user_id = ?', [userId], (err, row) => {
      const currentXp = row ? row.xp : 0;
      const currentLevel = row ? row.level : 1;
      const xpNeeded = getXpForLevel(currentLevel);
      const progressBar = getProgressBar(currentXp, xpNeeded);
      const percentage = Math.floor((currentXp / xpNeeded) * 100);

      const embed = new EmbedBuilder()
        .setTitle(`⚡ OPERATOR RANK PROFILE // ${targetUser.username.toUpperCase()}`)
        .setThumbnail(targetUser.displayAvatarURL({ extension: 'png', size: 256 }))
        .addFields(
          { name: '👤 OPERATOR', value: `<@${userId}> (\`${targetUser.tag}\`)`, inline: true },
          { name: '📊 REPUTATION LEVEL', value: `\`LEVEL ${currentLevel}\``, inline: true },
          { name: '🧪 TOTAL EXP', value: `\`${currentXp} / ${xpNeeded} XP\``, inline: true },
          { name: '📈 RANK PROGRESS', value: `\`[${progressBar}] ${percentage}%\``, inline: false }
        )
        .setColor(0x00F0FF)
        .setFooter({ text: 'CCA Leveling Matrix System' })
        .setTimestamp();

      interaction.reply({ embeds: [embed] }).catch(() => {});
    });
  } catch (err) {
    console.error('Rank command error:', err.message);
  }
}

async function handleLeaderboardCommand(interaction) {
  try {
    db.all('SELECT user_id, xp, level FROM levels ORDER BY xp DESC LIMIT 10', async (err, rows) => {
      if (err || !rows || rows.length === 0) {
        return interaction.reply({ content: '📊 Belum ada data leaderboard.', flags: 64 });
      }

      let description = '```text\nRANK | LEVEL | XP      | OPERATOR\n-----+-------+---------+-------------------\n';
      rows.forEach((row, index) => {
        const rankNum = String(index + 1).padStart(4, ' ');
        const levelNum = String(row.level).padStart(5, ' ');
        const xpNum = String(row.xp).padStart(7, ' ');
        description += `${rankNum} | ${levelNum} | ${xpNum} | <@${row.user_id}>\n`;
      });
      description += '```';

      const embed = new EmbedBuilder()
        .setTitle('🏆 CCA TOP OPERATOR LEADERBOARD')
        .setDescription(`Top 10 Hacker Paling Aktif di **CYBERSECURITY COMMUNITY OF ACEH**:\n\n${description}`)
        .setColor(0x00F0FF)
        .setFooter({ text: 'CCA Leaderboard Matrix' })
        .setTimestamp();

      interaction.reply({ embeds: [embed] }).catch(() => {});
    });
  } catch (err) {
    console.error('Leaderboard command error:', err.message);
  }
}

module.exports = { handleMessageXP, handleRankCommand, handleLeaderboardCommand };
