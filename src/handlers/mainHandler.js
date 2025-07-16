const { Markup } = require('telegraf');
const db = require('../services/db');

// Exact main menu layout
const MAIN_MENU_KEYBOARD = Markup.keyboard([
    ['🔍 Find Partner'],
    ['👤 Edit Profile', '💰 My Coins'],
    ['💬 Anonymous Chat', '🎁 Free Coins'],
    ['🛒 Buy Coins', '🔗 Personal Link']
]).resize();

async function showMainMenu(ctx) {
    return ctx.reply('Main Menu:', MAIN_MENU_KEYBOARD);
}

// --- Handlers for each button ---
async function handleFindPartner(ctx) {
    return ctx.scene.enter('partner-search-wizard');
}

async function handleEditProfile(ctx) {
    // We'll create this scene next
    return ctx.scene.enter('profile-edit-wizard');
}

async function handleMyCoins(ctx) {
    const coins = await db.getUserCoins(ctx.from.id);
    // You can add logic here to count referrals from the DB
    return ctx.reply(`💰 You currently have ${coins} coins.`);
}

async function handleAnonymousChat(ctx) {
    return ctx.reply('Anonymous Chat feature is under development.');
}

async function handleFreeCoins(ctx) {
    return ctx.reply('You can get free coins by sharing your Personal Link!');
}

async function handleBuyCoins(ctx) {
    // This mimics the video, providing an ID/address for manual payment
    const paymentId = '...'; // Your Tron/wallet address or payment ID
    return ctx.reply(`To buy coins, please transfer funds to the following address and contact support:\n\nAddress: \`${paymentId}\`\n\nSupport: @monster_eks`, { parse_mode: 'Markdown' });
}

async function handlePersonalLink(ctx) {
    const link = `https://t.me/${process.env.BOT_USERNAME}?start=${ctx.from.id}`;
    return ctx.reply(`Share your personal link to get 10 free coins for every user who joins!\n\n${link}`);
}

module.exports = {
    showMainMenu,
    handleFindPartner, handleEditProfile, handleMyCoins,
    handleAnonymousChat, handleFreeCoins, handleBuyCoins, handlePersonalLink
};
