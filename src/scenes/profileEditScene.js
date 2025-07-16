const { Scenes, Markup } = require('telegraf');
const db = require('../services/db');

const showEditMenu = async (ctx) => {
    const profile = (await db.findProfileById(ctx.from.id)).rows[0];
    const message = `
👤 **Your Profile**
Gender: ${profile.gender || 'Not set'}
Age: ${profile.age || 'Not set'}
City: ${profile.city || 'Not set'}
Orientation: ${profile.orientation || 'Not set'}
Fantasy: ${profile.fantasy || 'Not set'}
Bio: ${profile.description ? '✔️' : 'Not set'}

What would you like to edit?
    `;
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🏙️ City', 'EDIT_city'), Markup.button.callback('🎂 Age', 'EDIT_age')],
        [Markup.button.callback('📝 Bio', 'EDIT_description'), Markup.button.callback('🖼️ Photo', 'EDIT_photo')],
        [Markup.button.callback('Done', 'LEAVE_EDIT')]
    ]);
    if (ctx.callbackQuery) {
        return ctx.editMessageText(message, keyboard);
    }
    return ctx.reply(message, keyboard);
}

const profileEditWizard = new Scenes.WizardScene('profile-edit-wizard',
    // 1. Show the edit menu
    async (ctx) => {
        await showEditMenu(ctx);
        return ctx.wizard.next();
    },
    // 2. Handle user's choice
    async (ctx) => {
        if (!ctx.callbackQuery) return;
        const choice = ctx.callbackQuery.data;
        if (choice === 'LEAVE_EDIT') {
            await ctx.editMessageText('Changes saved.');
            return ctx.scene.leave();
        }
        
        const fieldToEdit = choice.split('_')[1];
        ctx.wizard.state.fieldToEdit = fieldToEdit;
        await ctx.editMessageText(`Please send me your new ${fieldToEdit}.`);
        return ctx.wizard.next();
    },
    // 3. Get new value and update DB
    async (ctx) => {
        const field = ctx.wizard.state.fieldToEdit;
        const value = ctx.message?.photo ? ctx.message.photo.pop().file_id : ctx.message?.text;

        if (!value) {
            await ctx.reply('Invalid input. Please try again.');
            return showEditMenu(ctx.scene.ctx); // Go back to menu
        }

        await db.updateProfile(ctx.from.id, field, value);
        await ctx.reply(`Your ${field} has been updated.`);
        
        // Go back to the edit menu to allow more edits
        ctx.wizard.selectStep(0);
        return ctx.wizard.steps[0](ctx);
    }
);
module.exports = profileEditWizard;
