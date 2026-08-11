const { AuditLogEvent, EmbedBuilder } = require('discord.js');

const deleteTracker = new Map();

async function handleChannelDelete(channel) {
  try {
    const guild = channel.guild;
    const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
    const entry = auditLogs.entries.first();
    if (!entry) return;

    const executor = entry.executor;
    if (executor.bot) return; // Skip bot actions

    const userId = executor.id;
    const now = Date.now();

    if (!deleteTracker.has(userId)) {
      deleteTracker.set(userId, []);
    }

    const timestamps = deleteTracker.get(userId).filter(t => now - t < 10000); // 10s window
    timestamps.push(now);
    deleteTracker.set(userId, timestamps);

    if (timestamps.length >= 3) {
      console.warn(`🚨 ANTI-NUKE TRIGGERED: ${executor.tag} deleted ${timestamps.length} channels in 10s!`);

      const member = await guild.members.fetch(userId);
      const sentinelRole = guild.roles.cache.find(r => r.name === '[CCA] Cyber Sentinel');
      if (sentinelRole && member.roles.cache.has(sentinelRole.id)) {
        await member.roles.remove(sentinelRole, 'Anti-nuke triggered: Mass channel deletion');
      }

      const auditCh = guild.channels.cache.find(c => c.name.includes('soc-audit-logs'));
      if (auditCh) {
        const embed = new EmbedBuilder()
          .setTitle('🚨 EMERGENCY: ANTI-NUKE SAFEGUARD TRIGGERED')
          .setDescription(`Pengguna <@${userId}> (\`${executor.tag}\`) terdeteksi menghapus ${timestamps.length} channel dalam 10 detik!\n\n**Tindakan Otomatis:** Role Moderasi (\`[CCA] Cyber Sentinel\`) telah dicabut otomatis demi keamanan server.`)
          .setColor(0x990000)
          .setTimestamp();
        await auditCh.send({ embeds: [embed] });
      }
    }
  } catch (err) {
    console.error('Error in anti-nuke handler:', err);
  }
}

module.exports = { handleChannelDelete };
