const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// حفظ نقاط ومستويات الأعضاء
const userData = {};

// قائمة الكلمات للتحدي
const words = ['pixel', 'quest', 'discord', 'victory', 'legend', 'master', 'speed', 'challenge', 'hero', 'empire', 'cyber', 'shadow'];

function getUser(userId) {
    if (!userData[userId]) {
        userData[userId] = { xp: 0, level: 1 };
    }
    return userData[userId];
}

// نظام الرتب والمستويات المحدث
function getTitle(level) {
    if (level >= 100) return '💎 Supreme';
    if (level >= 90)  return '🌌 Immortal';
    if (level >= 70)  return '🌋 Titan';
    if (level >= 50)  return '🔮 Mythic';
    if (level >= 40)  return '👑 Legend';
    if (level >= 30)  return '⚡ Elite';
    if (level >= 20)  return '🛡️ Knight';
    if (level >= 10)  return '⚔️ Master';
    if (level >= 5)   return '🎯 Challenger';
    return '🌱 Novice';
}

client.on('ready', () => {
    console.log(`🤖 البوت [ PixelQuest ] متصل وجاهز بنظام الرتب المحدث!`);
});

let activeGame = null;

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const user = getUser(message.author.id);

    // 1️⃣ أمر البروفايل (!profile)
    if (command === 'profile') {
        const title = getTitle(user.level);
        const nextLevelXp = user.level * 30;

        const embed = new EmbedBuilder()
            .setTitle(`🎮 البروفايل الشخصي لـ ${message.author.username}`)
            .setThumbnail(message.author.displayAvatarURL())
            .setColor('#9B59B6')
            .addFields(
                { name: '🎖️ الرتبة الحالية (Title)', value: `**${title}**`, inline: true },
                { name: '📊 المستوى (Level)', value: `**${user.level}**`, inline: true },
                { name: '⭐ نقاط الخبرة (XP)', value: `**${user.xp} / ${nextLevelXp}**`, inline: true }
            )
            .setFooter({ text: 'PixelQuest - شارك في التحديات للوصول لرتبة Supreme!' });

        return message.reply({ embeds: [embed] });
    }

    // 2️⃣ أمر قائمة الأوائل (!top)
    if (command === 'top') {
        const sorted = Object.keys(userData)
            .map(id => ({ id, ...userData[id] }))
            .sort((a, b) => b.level - a.level || b.xp - a.xp)
            .slice(0, 10);

        if (sorted.length === 0) {
            return message.reply('❌ لا يوجد لاعبون في القائمة حتى الآن!');
        }

        let desc = '';
        sorted.forEach((u, i) => {
            const badge = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🔹';
            desc += `${badge} **#${i + 1}** <@${u.id}> - Level: **${u.level}** (${getTitle(u.level)}) | **${u.xp} XP**\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle('🏆 قائمة أبطال السيرفر (Top 10 Leaderboard)')
            .setDescription(desc)
            .setColor('#F1C40F');

        return message.reply({ embeds: [embed] });
    }

    // 3️⃣ أمر تحدي أسرع كتابة (!type)
    if (command === 'type') {
        if (activeGame) {
            return message.reply('⚠️ هناك تحدٍ جارٍ حالياً!');
        }

        const targetWord = words[Math.floor(Math.random() * words.length)];
        activeGame = { word: targetWord, channelId: message.channel.id };

        const embed = new EmbedBuilder()
            .setTitle('⚡ تحدي السرعة بدأ!')
            .setDescription(`أسرع شخص يكتب الكلمة التالية يحصل على نقاط XP:\n\n👉 **\`${targetWord}\`**`)
            .setColor('#E74C3C');

        message.channel.send({ embeds: [embed] });

        setTimeout(() => {
            if (activeGame && activeGame.word === targetWord) {
                activeGame = null;
                message.channel.send('⏰ انتهى الوقت دون أن يجيب أحد!');
            }
        }, 15000);
        return;
    }

    // 4️⃣ أمر المساعدة (!help)
    if (command === 'help') {
        const embed = new EmbedBuilder()
            .setTitle('📜 قائمة أوامر PixelQuest')
            .setDescription('تنافس واجمع النقاط للوصول للرتبة الأسطورية **Supreme**!')
            .addFields(
                { name: '`!profile`', value: 'عرض مستواك الحالي ورتبتك والـ XP.' },
                { name: '`!type`', value: 'بدء لعبة كتابة سريعة لكسب الـ XP.' },
                { name: '`!top`', value: 'عرض قائمة أفضل 10 لاعبين في السيرفر.' }
            )
            .setColor('#3498DB');

        return message.reply({ embeds: [embed] });
    }
});

// احتساب النقاط وزيادة المستويات
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // إعطاء نقاط عند التفاعل العادي في الشات
    if (!message.content.startsWith('!')) {
        const user = getUser(message.author.id);
        user.xp += 2;

        const xpNeeded = user.level * 30;
        if (user.xp >= xpNeeded) {
            user.level += 1;
            user.xp = 0;
            message.reply(`🎉 مبروك يا بطل ${message.author}! ارتفع مستواك إلى **Level ${user.level}** وأصبحت برتبة **${getTitle(user.level)}**! 🚀`);
        }
    }

    // إعطاء نقاط عند حل التحدي (!type)
    if (activeGame && message.channel.id === activeGame.channelId && message.content.toLowerCase() === activeGame.word) {
        const user = getUser(message.author.id);
        user.xp += 25;

        const xpNeeded = user.level * 30;
        if (user.xp >= xpNeeded) {
            user.level += 1;
            user.xp = 0;
            message.reply(`🔥 إجابة أسطورية! ارتفع مستواك إلى **Level ${user.level}** ورتبتك الآن **${getTitle(user.level)}**!`);
        } else {
            message.reply(`👏 رائع! كسبت **25 XP** لتفوقك في التحدي!`);
        }

        activeGame = null;
    }
});

client.login(process.env.DISCORD_TOKEN);
