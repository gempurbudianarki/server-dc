const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../db/database');

const activeChallenges = new Map();

function generateChallenge(userId) {
  const num1 = Math.floor(Math.random() * 80) + 10;
  const num2 = Math.floor(Math.random() * 9) + 1;
  const answer = (num1 + num2).toString();
  activeChallenges.set(userId, { answer, expires: Date.now() + 180000 });
  return { num1, num2 };
}

async function handleVerificationButton(interaction) {
  try {
    const verifiedRole = interaction.guild.roles.cache.find(r => r.name.includes('Verified Member'));
    if (verifiedRole && interaction.member.roles.cache.has(verifiedRole.id)) {
      return interaction.reply({
        content: '⚠️ **Identitas Terverifikasi!** Anda sudah memiliki role `[CCA] Verified Member`. Tidak perlu melakukan verifikasi ulang.',
        flags: 64
      }).catch(() => {});
    }

    const challenge = generateChallenge(interaction.user.id);
    const modal = new ModalBuilder()
      .setCustomId('modal_verify_captcha')
      .setTitle('🛡️ Captcha Verification');

    const input = new TextInputBuilder()
      .setCustomId('captcha_answer')
      .setLabel(`Berapa hasil dari ${challenge.num1} + ${challenge.num2}?`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Masukkan angka jawaban di sini')
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
  } catch (err) {
    console.error('Verification button error:', err.message);
  }
}

async function handleVerificationModal(interaction) {
  try {
    const userId = interaction.user.id;
    const userAnswer = interaction.fields.getTextInputValue('captcha_answer').trim();
    const challenge = activeChallenges.get(userId);

    if (!challenge || Date.now() > challenge.expires) {
      return interaction.reply({ content: '❌ Sesi verifikasi expired. Silakan klik tombol verifikasi lagi.', flags: 64 }).catch(() => {});
    }

    if (userAnswer !== challenge.answer) {
      return interaction.reply({ content: `❌ Jawaban salah! (${challenge.num1} + ${challenge.num2} bukan ${userAnswer}). Coba lagi.`, flags: 64 }).catch(() => {});
    }

    activeChallenges.delete(userId);

    const guild = interaction.guild;
    const verifiedRole = guild.roles.cache.find(r => r.name.includes('Verified Member'));
    if (verifiedRole) {
      await interaction.member.roles.add(verifiedRole);
    }

    // Save to DB
    db.run('INSERT OR REPLACE INTO verifications (user_id) VALUES (?)', [userId]);

    // Send greeting to access logs lobby
    const welcomeCh = guild.channels.cache.find(c => c.name.includes('access-logs'));
    if (welcomeCh) {
      const rulesCh = guild.channels.cache.find(c => c.name.includes('terminal-rules'));
      const mainFrameCh = guild.channels.cache.find(c => c.name.includes('main-frame'));
      const threatCh = guild.channels.cache.find(c => c.name.includes('threat-feeds'));
      const ticketCh = guild.channels.cache.find(c => c.name.includes('create-ticket'));

      const avatarUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 256 });

      const embed = new EmbedBuilder()
        .setTitle('⚡ [SYSTEM] NEW OPERATOR AUTHENTICATED')
        .setDescription(
          `\`\`\`text\n[+] IDENTITY VERIFIED: SUCCESS\n[+] SECURITY CLEARANCE: LEVEL 1 GRANTED\n\`\`\`\n` +
          `Selamat datang **<@${userId}>** (\`${interaction.user.tag}\`) di **CYBERSECURITY COMMUNITY OF ACEH (CCA)**! 🛡️⚡\n\n` +
          `Wadah resmi komunitas, praktisi, dan peneliti Keamanan Siber Provinsi Aceh.`
        )
        .addFields(
          { name: '🆔 OPERATOR IDENTITY', value: `> **User:** <@${userId}>\n> **Clearance:** \`🟢 [CCA] Verified Member\`\n> **Status:** \`ACTIVE / ONLINE\``, inline: false },
          { name: '📍 QUICK NAVIGATION PROTOCOL', value: `📜 **Aturan Server:** ${rulesCh ? `<#${rulesCh.id}>` : '#terminal-rules'}\n💬 **Diskusi Utama:** ${mainFrameCh ? `<#${mainFrameCh.id}>` : '#main-frame'}\n🗞️ **Intel & Cyber News:** ${threatCh ? `<#${threatCh.id}>` : '#threat-feeds'}\n🎟️ **Bantuan Helpdesk:** ${ticketCh ? `<#${ticketCh.id}>` : '#create-ticket'}`, inline: false }
        )
        .setThumbnail(avatarUrl)
        .setColor(0x00F0FF)
        .setFooter({ text: 'CCA Security System v2.0 • Encrypted Protocol' })
        .setTimestamp();

      await welcomeCh.send({ content: `👋 Selamat datang Operator <@${userId}>!`, embeds: [embed] });
    }

    await interaction.reply({ content: '✅ Verifikasi sukses! Anda telah diberikan akses sebagai `[CCA] Verified Member`.', flags: 64 }).catch(() => {});
  } catch (err) {
    console.error('Verification modal error:', err.message);
  }
}

module.exports = { handleVerificationButton, handleVerificationModal };
