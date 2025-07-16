const { Scenes, Markup } = require('telegraf');
const db = require('../services/db');

const CHAT_REQUEST_COST = 5; // Cost in coins

// Helper to show the current profile
async function showPartnerProfile(ctx) {
    const profile = ctx.wizard.state.partners[ctx.wizard.state.currentIndex];
    if (!profile) {
        await ctx.reply("That's everyone for now! Try changing your filters.");
        return ctx.scene.leave();
    }
    const caption = `**${profile.first_name}**, ${profile.age} from **${profile.city}**\nOrientation: ${profile.orientation}\nFantasy: ${profile.fantasy}\n\n${profile.description}`;

    await ctx.replyWithPhoto(profile.photo_file_id, {
        caption, parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [Markup.button.callback(`💬 Request Chat (${CHAT_REQUEST_COST} coins)`, `CHAT_${profile.user_id}`)],
                [Markup.button.callback('➡️ Next', 'NEXT'), Markup.button.callback('❌ Block', `BLOCK_${profile.user_id}`)],
                [Markup.button.callback('Report', `REPORT_${profile.user_id}`), Markup.button.callback('🛑 Stop Searching', 'LEAVE')]
            ]
        }
    });
}

const partnerSearchWizard = new Scenes.WizardScene('partner-search-wizard',
    // 1. Ask for gender filter
    async (ctx) => {
        ctx.wizard.state.filters = {};
        await ctx.reply('Who are you looking for?', Markup.inlineKeyboard([
            [Markup.button.callback('Men', 'FILTER_GENDER_MALE'), Markup.button.callback('Women', 'FILTER_GENDER_FEMALE')],
            [Markup.button.callback('Anyone', 'FILTER_GENDER_ANY')]
        ]));
        return ctx.wizard.next();
    },
    // 2. Get gender, ask for city
    async (ctx) => {
        const choice = ctx.callbackQuery.data.split('_')[2];
        if (choice !== 'ANY') ctx.wizard.state.filters.gender = choice;
        await ctx.answerCbQuery();
        await ctx.editMessageText('Enter a city name to filter by, or type "any".');
        return ctx.wizard.next();
    },
    // 3. Get city, start search
    async (ctx) => {
        const city = ctx.message.text.toLowerCase();
        if (city !== 'any') ctx.wizard.state.filters.city = city;

        await ctx.reply('Searching...');
        const partners = await db.findPartners(ctx.from.id, ctx.wizard.state.filters);
        if (partners.rows.length === 0) {
            await ctx.reply('No matching partners found. Try loosening your filters.');
            return ctx.scene.leave();
        }
        ctx.wizard.state.partners = partners.rows;
        ctx.wizard.state.currentIndex = 0;
        await showPartnerProfile(ctx);
        return ctx.wizard.next();
    },
    // 4. Handle interactions
    async (ctx) => {
        if (!ctx.callbackQuery) return;
        const [action, targetIdStr] = ctx.callbackQuery.data.split('_');
        const targetId = parseInt(targetIdStr);
        await ctx.deleteMessage(); // Clean up previous profile message

        switch (action) {
            case 'NEXT':
                ctx.wizard.state.currentIndex++;
                break;
            case 'LEAVE':
                await ctx.reply('Stopped searching.');
                return ctx.scene.leave();
            case 'BLOCK':
                await db.blockUser(ctx.from.id, targetId);
                await ctx.reply('User has been blocked. They will not see you and you will not see them.');
                ctx.wizard.state.currentIndex++;
                break;
            case 'CHAT':
                const userCoins = await db.getUserCoins(ctx.from.id);
                if (userCoins < CHAT_REQUEST_COST) {
                    await ctx.reply(`You don't have enough coins! You need ${CHAT_REQUEST_COST} coins to send a chat request. Visit "Buy Coins" in the main menu.`);
                } else {
                    await db.updateUserCoins(ctx.from.id, -CHAT_REQUEST_COST);
                    await db.createChatRequest(ctx.from.id, targetId);
                    await ctx.reply(`Chat request sent! You now have ${userCoins - CHAT_REQUEST_COST} coins.`);
                }
                ctx.wizard.state.currentIndex++;
                break;
        }
        return showPartnerProfile(ctx);
    }
);
module.exports = partnerSearchWizard;
