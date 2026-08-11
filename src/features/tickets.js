const { ChannelType, ThreadAutoArchiveDuration, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../db/database');

async function handleOpenTicketButton(interaction) {
  const guild = interaction.guild;
  const userId = interaction.user.id;

  // Fetch ticket counter from DB
  db.get('SELECT MAX(ticket_number) as max_num FROM tickets', async (err, row) => {
    const nextNum = (row && row.max_num) ? row.max_num + 1 : 1;
    const ticketName = `ticket-${String(nextNum).padStart(4, '0')}`;

    const ticketChannel = interaction.channel; // #create-ticket
    const thread = await ticketChannel.threads.create({
      name: ticketName,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      type: ChannelType.PrivateThread,
      reason: `Ticket created by ${interaction.user.tag}`
    });

    await thread.members.add(userId);

    // Save ticket to DB
    db.run('INSERT INTO tickets (ticket_number, thread_id, user_id) VALUES (?, ?, ?)', [nextNum, thread.id, userId]);

    const embed = new EmbedBuilder()
      .setTitle(`🎟️ Helpdesk Ticket #${String(nextNum).padStart(4, '0')}`)
      .setDescription(`Halo <@${userId}>,\nTerima kasih telah menghubungi Helpdesk CCA! Tim Moderator (\`[CCA] Cyber Sentinel\`) akan segera membantu kendala Anda.\n\nKlik **Tutup Tiket** di bawah jika masalah sudah selesai.`)
      .setColor(0x0066CC);

    const btn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_close_ticket')
        .setLabel('🔒 Tutup Tiket')
        .setStyle(ButtonStyle.Danger)
    );

    await thread.send({ embeds: [embed], components: [btn] });
    await interaction.reply({ content: `✅ Tiket berhasil dibuat: <#${thread.id}>`, ephemeral: true });
  });
}

async function handleCloseTicketButton(interaction) {
  const thread = interaction.channel;
  if (!thread.isThread()) return;

  await interaction.reply({ content: '🔒 Tiket akan ditutup dan diarsipkan dalam 5 detik...' });

  setTimeout(async () => {
    db.run('UPDATE tickets SET status = ? WHERE thread_id = ?', ['CLOSED', thread.id]);
    
    // Log to transcript channel
    const transcriptCh = interaction.guild.channels.cache.find(c => c.name.includes('arsip-transkrip') || c.name.includes('transcript'));
    if (transcriptCh) {
      const embed = new EmbedBuilder()
        .setTitle(`📂 Ticket Transcript Archived: ${thread.name}`)
        .setDescription(`Tiket <#${thread.id}> telah ditutup oleh <@${interaction.user.id}>.`)
        .setColor(0x990000)
        .setTimestamp();
      await transcriptCh.send({ embeds: [embed] });
    }

    await thread.setArchived(true);
  }, 5000);
}

module.exports = { handleOpenTicketButton, handleCloseTicketButton };
