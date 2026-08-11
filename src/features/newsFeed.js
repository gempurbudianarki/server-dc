const Parser = require('rss-parser');
const { EmbedBuilder } = require('discord.js');
const { db } = require('../db/database');

const parser = new Parser();
const FEEDS = [
  { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews' },
  { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/' }
];

async function checkCyberNewsFeed(client, guildId) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const newsCh = guild.channels.cache.find(c => c.name.includes('threat-feeds'));
    if (!newsCh) return;

    for (const feedConfig of FEEDS) {
      const feed = await parser.parseURL(feedConfig.url);
      for (const item of feed.items.slice(0, 3)) { // Check top 3 items
        const guid = item.guid || item.link;

        // Check if posted in DB
        db.get('SELECT guid FROM rss_posted WHERE guid = ?', [guid], async (err, row) => {
          if (err || row) return; // Skip if error or already posted

          const embed = new EmbedBuilder()
            .setTitle(`🗞️ [${feedConfig.name}] ${item.title}`)
            .setURL(item.link)
            .setDescription(item.contentSnippet ? item.contentSnippet.substring(0, 250) + '...' : 'Klik tautan untuk membaca berita lengkap.')
            .setColor(0x00CCCC)
            .setTimestamp(new Date(item.pubDate || Date.now()));

          await newsCh.send({ embeds: [embed] });

          // Insert into DB to deduplicate
          db.run('INSERT INTO rss_posted (guid, source) VALUES (?, ?)', [guid, feedConfig.name]);
        });
      }
    }
  } catch (err) {
    console.error('❌ Error fetching RSS cyber news feed:', err.message);
  }
}

function startNewsFeedService(client, guildId) {
  // Initial check on startup after 10s delay
  setTimeout(() => checkCyberNewsFeed(client, guildId), 10000);
  // Schedule every 60 minutes
  setInterval(() => checkCyberNewsFeed(client, guildId), 3600000);
}

module.exports = { startNewsFeedService };
