require('dotenv').config();

if (!process.env.BOT_TOKEN || !process.env.GUILD_ID) {
  console.error("❌ ERROR: BOT_TOKEN and GUILD_ID must be set in .env!");
  process.exit(1);
}

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  GUILD_ID: process.env.GUILD_ID,
  CLIENT_ID: process.env.CLIENT_ID || ""
};
