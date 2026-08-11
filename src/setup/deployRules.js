const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { BOT_TOKEN, GUILD_ID } = require('../config');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log(`🤖 Rulebook Deployer logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const rulesCh = guild.channels.cache.find(c => c.name.includes('aturan-terminal') || c.name.includes('rules'));

    if (!rulesCh) {
      console.error('❌ Channel aturan-terminal tidak ditemukan!');
      process.exit(1);
    }

    // Clear old messages in rules channel if any
    const fetched = await rulesCh.messages.fetch({ limit: 10 });
    if (fetched.size > 0) {
      await rulesCh.bulkDelete(fetched).catch(() => {});
    }

    const embedHeader = new EmbedBuilder()
      .setTitle('📜 CYBERSECURITY COMMUNITY OF ACEH (CCA) // PROTOKOL & ATURAN SERVER')
      .setDescription(
        `\`\`\`text\n[+] SECURE PROTOCOL TERMINAL v2.0\n[+] COMMUNITY CODE OF CONDUCT & ETHICS\n\`\`\`\n` +
        `Selamat datang di **CYBERSECURITY COMMUNITY OF ACEH (CCA)**. Seluruh anggota wajib membaca, memahami, dan mematuhi tata tertib serta etika keamanan siber berikut demi menjaga lingkungan riset yang kondusif, profesional, dan legal.`
      )
      .setColor(0x00F0FF);

    const embedRules = new EmbedBuilder()
      .setTitle('📌 TATA TERTIB & ETIKA KEAMANAN SIBER')
      .addFields(
        {
          name: '1. 🛡️ ETIKA RESPONSIBLE DISCLOSURE & NO ILLEGAL HACKING',
          value: '• Dilarang keras menyebarkan malware aktif, ransomware, credential dump ilegal, atau ajakan peretasan tanpa izin (*Unauthorized Access* / *Black-Hat Hacking*).\n• Seluruh diskusi difokuskan untuk riset edukasi, etika penetrasi (*White-Hat*), bug bounty resmi, dan latihan CTF.'
        },
        {
          name: '2. 🤝 ETIKA BERDISKUSI & MENGERTI ANGGOTA',
          value: '• Saling menghormati sesama peneliti dan anggota.\n• Dilarang melakukan cyberbullying, pelecehan, SARA, atau ujaran kebencian (*Hate Speech*).'
        },
        {
          name: '3. 🚫 DILARANG SPAM, PHISHING, & IKLAN ILEGAL',
          value: '• Dilarang menyebarkan link phishing, scampage, malware installer, atau spam referral.\n• Promosi proyek/jasa hanya diperbolehkan di channel yang relevan (`#✦・💼・loker-cyber` / `#✦・🛠️・berbagi-tools`).'
        },
        {
          name: '4. 📍 PENGGUNAAN CHANNEL SESUAI TOPIK',
          value: '• Harap berdiskusi sesuai fungsi channel (WebSec di `#web-exploitation`, CTF di `#ctf-radar`, Bug Bounty di `#diskusi-bounty`).\n• Gunakan `#✦・💬・diskusi-bebas` untuk obrolan santai non-teknis.'
        },
        {
          name: '5. 👑 KEPATUHAN PADA TIM SENTINEL & ADMIN',
          value: '• Keputusan Tim Moderator (`[CCA] Cyber Sentinel`) dan Admin (`[CCA] Root Admin`) bersifat mutlak demi menjaga keamanan dan reputasi komunitas.'
        }
      )
      .setColor(0x0066FF)
      .setFooter({ text: 'Sistem Keamanan CCA • Pelanggaran Aturan Dapat Mengakibatkan Ban Permanen', iconURL: guild.iconURL() })
      .setTimestamp();

    await rulesCh.send({ embeds: [embedHeader, embedRules] });
    console.log('✅ Rulebook Embed successfully posted to #✦・📜・aturan-terminal!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error deploying rules:', err);
    process.exit(1);
  }
});

client.login(BOT_TOKEN);
