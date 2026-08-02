const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// حفظ بيانات الأعضاء في الذاكرة
const userData = {};

// 📝 بنك الكلمات العربية للعبة أسرع كتابة وفك الحروف
const arabicWords = [
    'السرعة', 'التحدي', 'الانتصار', 'البطولة', 'الأسطورة', 'الإمبراطور', 'المنافسة', 'البرمجة',
    'الذكاء', 'المعركة', 'الاحتراف', 'القمة', 'الإبداع', 'المستقبل', 'التطوير', 'الذهب',
    'الماس', 'العاصفة', 'الشجاعة', 'القوة', 'البركان', 'الصمود', 'السيادة', 'الصقر',
    'النمر', 'الأسد', 'الفرسان', 'القلعة', 'السيف', 'الدرع', 'المملكة', 'الاستراتيجية',
    'المغامرة', 'التألق', 'التميز', 'الفرصة', 'الإنجاز', 'التفوق', 'الراية', 'الشرف',
    'البريق', 'الفروسية', 'البسالة', 'العزيمة', 'الإصرار', 'الطموح', 'النجاح', 'القدرة',
    'الهيبة', 'المجد', 'القيادة', 'المهارة', 'الابتكار', 'الحكمة', 'العبقرية', 'السيطرة'
];

function getUser(userId) {
    if (!userData[userId]) {
        userData[userId] = { xp: 0, level: 1, lastDaily: 0 };
    }
    return userData[userId];
}

// نظام الرتب الإنجليزي حتى مستوى 100+
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

// لخلطة حروف الكلمة للعبة !scramble
function shuffleWord(word) {
    const arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join(' ');
}

client.on('ready', () => {
    console.log(`🤖 البوت [ PixelQuest ] متصل وجاهز بجميع الميزات والأوامر المفصولة!`);
});

let activeGame = null; // { type: 'type'|'math'|'scramble', answer: string, channelId: string }
let awaitingPasswordUser = null; // مخصص لحفظ حالة طلب كلمة سر !setup

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // 🔐 1. التحقق من كلمة السر لأمر Setup
    if (awaitingPasswordUser && message.author.id === awaitingPasswordUser) {
        if (message.content.startsWith('!')) {
            awaitingPasswordUser = null;
            return message.reply('⚠️ **تم إلغاء عملية الـ Setup.** اكتب `!setup` مجدداً إذا أردت المحاولة.');
        }

        if (message.content.trim() === 'yassir') {
            awaitingPasswordUser = null;
            const guild = message.guild;

            await message.reply('🔓 **كلمة السر صحيحة! جاري بناء السيرفر وإعادة تنسيقه بالكامل...**');

            try {
                // مسح القنوات القديمة
                const channels = await guild.channels.fetch();
                for (const [id, channel] of channels) {
                    if (channel) await channel.delete().catch(() => {});
                }

                // إنشاء الرتب
                await guild.roles.create({ name: '👑 ｜ Owner / Founder', color: '#E74C3C', permissions: [PermissionFlagsBits.Administrator] });
                await guild.roles.create({ name: '⚙️ ｜ Co-Owner', color: '#C0392B', permissions: [PermissionFlagsBits.Administrator] });
                await guild.roles.create({ name: '🛡️ ｜ Admin', color: '#E67E22' });
                await guild.roles.create({ name: '⚔️ ｜ Moderator', color: '#F39C12' });
                await guild.roles.create({ name: '🔨 ｜ Support / Helper', color: '#F1C40F' });
                await guild.roles.create({ name: '🚀 ｜ Server Booster', color: '#F472B6' });
                await guild.roles.create({ name: '💎 ｜ VIP Member', color: '#9B59B6' });
                await guild.roles.create({ name: '🎮 ｜ Member', color: '#3498DB' });

                // بناء الفئات والقنوات المنظمة
                const catInfo = await guild.channels.create({ name: '📌 ｜ WELCOME & INFO', type: ChannelType.GuildCategory });
                await guild.channels.create({ name: '👋-welcome', type: ChannelType.GuildText, parent: catInfo.id });
                await guild.channels.create({ name: '📜-rules', type: ChannelType.GuildText, parent: catInfo.id });
                await guild.channels.create({ name: '📢-announcements', type: ChannelType.GuildText, parent: catInfo.id });

                const catChat = await guild.channels.create({ name: '💬 ｜ COMMUNITY CHAT', type: ChannelType.GuildCategory });
                const mainChat = await guild.channels.create({ name: '💬-general-chat', type: ChannelType.GuildText, parent: catChat.id });
                await guild.channels.create({ name: '🤖-bot-commands', type: ChannelType.GuildText, parent: catChat.id });
                await guild.channels.create({ name: '📸-media', type: ChannelType.GuildText, parent: catChat.id });

                const catGames = await guild.channels.create({ name: '🎮 ｜ MINI GAMES & FUN', type: ChannelType.GuildCategory });
                await guild.channels.create({ name: '⚡-fast-type', type: ChannelType.GuildText, parent: catGames.id });
                await guild.channels.create({ name: '🏆-leaderboard', type: ChannelType.GuildText, parent: catGames.id });

                const catVoice = await guild.channels.create({ name: '🔊 ｜ VOICE CHANNELS', type: ChannelType.GuildCategory });
                await guild.channels.create({ name: '🔊 ｜ Lounge #1', type: ChannelType.GuildVoice, parent: catVoice.id });
                await guild.channels.create({ name: '🎮 ｜ Gaming Voice #1', type: ChannelType.GuildVoice, parent: catVoice.id });

                const embed = new EmbedBuilder()
                    .setTitle('🎉 تم بناء وتنسيق السيرفر بنجاح!')
                    .setDescription('السيرفر جاهز الآن ومُنظّم بالكامل! 🚀')
                    .setColor('#2ECC71');

                await mainChat.send({ embeds: [embed] });

            } catch (error) {
                console.error('حدث خطأ أثناء Setup:', error);
            }
            return;
        } else {
            awaitingPasswordUser = null;
            return message.reply('❌ **كلمة السر خاطئة!** تم إلغاء عملية إعادة بناء السيرفر.');
        }
    }

    // 💬 2. معالجة الرسائل العادية (نقاط التفاعل والتأكد من إجابات الألعاب)
    if (!message.content.startsWith('!')) {
        const user = getUser(message.author.id);
        user.xp += 2;

        const xpNeeded = user.level * 30;
        if (user.xp >= xpNeeded) {
            user.xp = 0;
            user.level += 1;
            message.reply(`🎉 مبروك يا بطل ${message.author}! ارتفع مستواك إلى **Level ${user.level}** ورتبتك الآن **${getTitle(user.level)}**! 🚀`);
        }

        // التحقق من حل الألعاب النشطة
        if (activeGame && message.channel.id === activeGame.channelId) {
            if (message.content.trim().toLowerCase() === activeGame.answer.toLowerCase()) {
                user.xp += 30; // 30 XP للفائز

                if (user.xp >= xpNeeded) {
                    user.xp = 0;
                    user.level += 1;
                    message.reply(`🔥 إجابة صحيحة يا بطل! ارتفع مستواك إلى **Level ${user.level}** ورتبتك الآن **${getTitle(user.level)}**!`);
                } else {
                    message.reply(`👏 رائع يا ${message.author}! إجابة صحيحة وكسبت **30 XP**!`);
                }

                activeGame = null;
            }
        }
        return;
    }

    // ⚙️ 3. معالجة الأوامر التي تبدأ بـ !
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const user = getUser(message.author.id);

    // ==========================================
    // 🛠️ جزئية إعادة بناء وتنسيق السيرفر (!setup)
    // ==========================================
    if (command === 'setup') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ هذا الأمر مخصص لإدارة السيرفر والـ Owners فقط!');
        }

        awaitingPasswordUser = message.author.id;
        return message.reply('🔒 **هذا الأمر حساس ومحمي بكلمة سر!**\nيرجى كتابة كلمة السر الآن لتأكيد مسح وتنسيق السيرفر (اكتب `yassir` فقط بدون إشارة `!`).');
    }

    // ==========================================
    // 👤 أوامر الأعضاء (Member Commands)
    // ==========================================
    if (command === 'help') {
        const embed = new EmbedBuilder()
            .setTitle('📜 قائمة أوامر الأعضاء | PixelQuest')
            .setDescription('تنافس واجمع النقاط للوصول للرتبة الأسطورية **Supreme**!')
            .addFields(
                { name: '👤 `!profile`', value: 'عرض ملفك الشخصي ورتبتك ونقاطك.' },
                { name: '🏆 `!top`', value: 'عرض قائمة أفضل 10 متصدرين في السيرفر.' },
                { name: '🎁 `!daily`', value: 'الحصول على المكافأة اليومية من النقاط.' },
                { name: '⚡ `!type`', value: 'بدء تحدي أسرع كتابة باللغة العربية.' },
                { name: '🧮 `!math`', value: 'بدء تحدي الحساب السريع.' },
                { name: '🔤 `!scramble`', value: 'بدء تحدي تجميع الحروف المبعثرة.' }
            )
            .setColor('#3498DB')
            .setFooter({ text: 'لأوامر الإدارة والأونر اكتب: !adminhelp' });

        return message.reply({ embeds: [embed] });
    }

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
            .setFooter({ text: 'PixelQuest - استمر في التفاعل للترقية!' });

        return message.reply({ embeds: [embed] });
    }

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

    if (command === 'daily') {
        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000;

        if (now - user.lastDaily < cooldown) {
            const remaining = cooldown - (now - user.lastDaily);
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            return message.reply(`⏳ لقد استلمت مكافأتك اليومية بالفعل! عد بعد **${hours} ساعة و ${minutes} دقيقة**.`);
        }

        user.lastDaily = now;
        user.xp += 100;

        let xpNeeded = user.level * 30;
        let msg = `🎁 مبروك! حصلت على **100 XP** كمكافأة يومية!`;

        if (user.xp >= xpNeeded) {
            user.xp -= xpNeeded;
            user.level += 1;
            msg += `\n🎉 وارتفع مستواك أيضاً إلى **Level ${user.level}** (${getTitle(user.level)})!`;
        }

        return message.reply(msg);
    }

    if (command === 'type') {
        if (activeGame) return message.reply('⚠️ هناك تحدٍ جارٍ بالفعل في السيرفر!');

        const targetWord = arabicWords[Math.floor(Math.random() * arabicWords.length)];
        activeGame = { type: 'type', answer: targetWord, channelId: message.channel.id };

        const embed = new EmbedBuilder()
            .setTitle('⚡ تحدي أسرع كتابة!')
            .setDescription(`أسرع شخص يكتب الكلمة التالية يحصل على نقاط XP:\n\n👉 **\`${targetWord}\`**`)
            .setColor('#E74C3C');

        message.channel.send({ embeds: [embed] });
        setTimeout(() => { if (activeGame && activeGame.answer === targetWord) { activeGame = null; message.channel.send('⏰ انتهى الوقت دون إجابة!'); } }, 15000);
        return;
    }

    if (command === 'math') {
        if (activeGame) return message.reply('⚠️ هناك تحدٍ جارٍ بالفعل في السيرفر!');

        const num1 = Math.floor(Math.random() * 50) + 1;
        const num2 = Math.floor(Math.random() * 50) + 1;
        const answer = (num1 + num2).toString();

        activeGame = { type: 'math', answer: answer, channelId: message.channel.id };

        const embed = new EmbedBuilder()
            .setTitle('🧮 تحدي الرياضيات السريع!')
            .setDescription(`أسرع شخص يحل المعادلة التالية يحصل على نقاط XP:\n\n👉 **\`${num1} + ${num2} = ?\`**`)
            .setColor('#2ECC71');

        message.channel.send({ embeds: [embed] });
        setTimeout(() => { if (activeGame && activeGame.answer === answer) { activeGame = null; message.channel.send('⏰ انتهى الوقت دون إجابة!'); } }, 15000);
        return;
    }

    if (command === 'scramble') {
        if (activeGame) return message.reply('⚠️ هناك تحدٍ جارٍ بالفعل في السيرفر!');

        const targetWord = arabicWords[Math.floor(Math.random() * arabicWords.length)];
        const scrambled = shuffleWord(targetWord);
        activeGame = { type: 'scramble', answer: targetWord, channelId: message.channel.id };

        const embed = new EmbedBuilder()
            .setTitle('🔤 تحدي فك الحروف المبعثرة!')
            .setDescription(`رتب الحروف التالية لتكوين الكلمة الصحيحة:\n\n👉 **\`${scrambled}\`**`)
            .setColor('#F39C12');

        message.channel.send({ embeds: [embed] });
        setTimeout(() => { if (activeGame && activeGame.answer === targetWord) { activeGame = null; message.channel.send('⏰ انتهى الوقت دون إجابة!'); } }, 20000);
        return;
    }

    // ==========================================
    // 👑 أوامر الإدارة والأونر (Admin Commands)
    // ==========================================
    if (command === 'adminhelp') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ هذا الأمر مخصص لإدارة السيرفر فقط!');
        }

        const embed = new EmbedBuilder()
            .setTitle('👑 قائمة أوامر الإدارة والـ Owners')
            .setDescription('أوامر خاصة بالتحكم بالنظام والمستويات وإعادة البناء:')
            .addFields(
                { name: '`!setup`', value: 'إعادة تنسيق السيرفر كلياً (محمي بكلمة سر).' },
                { name: '`!addxp @user amount`', value: 'إضافة نقاط XP محددة للـ User.' },
                { name: '`!removexp @user amount`', value: 'خصم نقاط XP من الـ User.' },
                { name: '`!setlevel @user level`', value: 'تعيين مستوى الـ User مباشرة.' }
            )
            .setColor('#E74C3C');

        return message.reply({ embeds: [embed] });
    }

    if (command === 'addxp') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('❌ مخصص للأونرز والإدارة فقط!');

        const target = message.mentions.members.first();
        const amount = parseInt(args[1]);
        if (!target || isNaN(amount)) return message.reply('❌ الاستخدام الصحيح: `!addxp @user 100`');

        const tUser = getUser(target.id);
        tUser.xp += amount;

        let xpNeeded = tUser.level * 30;
        while (tUser.xp >= xpNeeded) {
            tUser.xp -= xpNeeded;
            tUser.level += 1;
            xpNeeded = tUser.level * 30;
        }

        return message.reply(`✅ تم إضافة **${amount} XP** لـ ${target}! أصبح مستواه الآن **Level ${tUser.level}** (${getTitle(tUser.level)}).`);
    }

    if (command === 'removexp') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('❌ مخصص للأونرز والإدارة فقط!');

        const target = message.mentions.members.first();
        const amount = parseInt(args[1]);
        if (!target || isNaN(amount)) return message.reply('❌ الاستخدام الصحيح: `!removexp @user 50`');

        const tUser = getUser(target.id);
        tUser.xp = Math.max(0, tUser.xp - amount);

        return message.reply(`📉 تم خصم **${amount} XP** من ${target}. نقاطه الحالية: **${tUser.xp} XP**.`);
    }

    if (command === 'setlevel') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('❌ مخصص للأونرز والإدارة فقط!');

        const target = message.mentions.members.first();
        const newLevel = parseInt(args[1]);
        if (!target || isNaN(newLevel) || newLevel < 1) return message.reply('❌ الاستخدام الصحيح: `!setlevel @user 50`');

        const tUser = getUser(target.id);
        tUser.level = newLevel;
        tUser.xp = 0;

        return message.reply(`👑 تم تعيين مستوى ${target} إلى **Level ${newLevel}** ورتبته الآن **${getTitle(newLevel)}**!`);
    }
});

client.login(process.env.DISCORD_TOKEN);
