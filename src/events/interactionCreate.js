const { handleVerificationButton, handleVerificationModal } = require('../features/verification');
const { handleOpenTicketButton, handleCloseTicketButton } = require('../features/tickets');
const { handleRankCommand, handleLeaderboardCommand } = require('../features/leveling');

const cooldowns = new Map();

module.exports = async (interaction) => {
  try {
    if (interaction.isButton()) {
      // 5-second per user rate limiting
      const cooldownKey = `${interaction.user.id}_${interaction.customId}`;
      if (cooldowns.has(cooldownKey) && Date.now() < cooldowns.get(cooldownKey)) {
        return interaction.reply({ content: '⚠️ Harap tunggu beberapa detik sebelum mengklik tombol lagi.', flags: 64 }).catch(() => {});
      }
      cooldowns.set(cooldownKey, Date.now() + 5000);

      if (interaction.customId === 'btn_verify') {
        await handleVerificationButton(interaction);
      } else if (interaction.customId === 'btn_open_ticket') {
        await handleOpenTicketButton(interaction);
      } else if (interaction.customId === 'btn_close_ticket') {
        await handleCloseTicketButton(interaction);
      }
    } else if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'rank') {
        await handleRankCommand(interaction);
      } else if (interaction.commandName === 'leaderboard') {
        await handleLeaderboardCommand(interaction);
      }
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId === 'modal_verify_captcha') {
        await handleVerificationModal(interaction);
      }
    }
  } catch (err) {
    console.error('⚠️ Handled interaction error:', err.message);
  }
};
