const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { BOT_TOKEN, GUILD_ID, CLIENT_ID } = require('./config');
const { initDatabase } = require('./db/database');
const interactionCreate = require('./events/interactionCreate');
const { startNewsFeedService } = require('./features/newsFeed');
const { handleChannelDelete } = require('./events/antiNuke');
const { handleMessageXP } = require('./features/leveling');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

async function registerSlashCommands() {
  try {
    const commands = [
      new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Menampilkan kartu profil rank XP & reputasi operator')
        .addUserOption(opt => opt.setName('user').setDescription('Pilih pengguna lain (opsional)')),
      new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Menampilkan Top 10 Operator paling aktif di CCA')
    ].map(cmd => cmd.toJSON());

    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID || client.user.id, GUILD_ID), { body: commands });
    console.log('✅ Slash Commands (/rank, /leaderboard) successfully registered!');
  } catch (err) {
    console.error('❌ Error registering Slash Commands:', err.message);
  }
}

client.once('ready', async () => {
  console.log(`⚡ CCA Discord Bot is online as ${client.user.tag}`);
  await registerSlashCommands();
  startNewsFeedService(client, GUILD_ID);
});

client.on('interactionCreate', interactionCreate);
client.on('messageCreate', handleMessageXP);
client.on('channelDelete', handleChannelDelete);

initDatabase().then(() => {
  client.login(BOT_TOKEN);
}).catch(err => {
  console.error("❌ Database initialization error:", err);
});
