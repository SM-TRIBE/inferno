require('dotenv').config();
const { Telegraf, Scenes, session } = require('telegraf');
const db = require('./services/db');
const handlers = require('./handlers/mainHandler');
// Import all scenes
const profileCreationScene = require('./scenes/profileCreationScene');
const profileEditScene = require('./scenes/profileEditScene');
const partnerSearchScene = require('./scenes/partnerSearchScene');

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage([profileCreationScene, profileEditScene, partnerSearchScene]);

bot.context.handlers = handlers; // Make handlers accessible in scenes

bot.use(session());
bot.use(stage.middleware());

// --- START Command ---
bot.start(async (ctx) => { /* ... Same as previous version ... */ });

// --- Register All Main Menu Handlers ---
bot.hears('🔍 Find Partner', handlers.handleFindPartner);
bot.hears('👤 Edit Profile', handlers.handleEditProfile);
bot.hears('💰 My Coins', handlers.handleMyCoins);
bot.hears('💬 Anonymous Chat', handlers.handleAnonymousChat);
bot.hears('🎁 Free Coins', handlers.handleFreeCoins);
bot.hears('🛒 Buy Coins', handlers.handleBuyCoins);
bot.hears('🔗 Personal Link', handlers.handlePersonalLink);

bot.launch(() => console.log(`Bot @${process.env.BOT_USERNAME} is running...`));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
