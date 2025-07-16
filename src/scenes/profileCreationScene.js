const { Scenes, Markup } = require('telegraf');
const db = require('../services/db');

const profileWizard = new Scenes.WizardScene('profile-creation-wizard',
    // Steps for photo, gender, age, city (as before)... then add new steps
    (ctx) => { ctx.reply('Welcome! Send your profile photo.'); return ctx.wizard.next(); },
    async (ctx) => { /* Handle photo */ await db.updateProfile(ctx.from.id, 'photo_file_id', ctx.message.photo.pop().file_id); ctx.reply('Got it. Your gender?', Markup.inlineKeyboard([Markup.button.callback('Male', 'MALE'), Markup.button.callback('Female', 'FEMALE')])); return ctx.wizard.next(); },
    async (ctx) => { /* Handle gender */ await db.updateProfile(ctx.from.id, 'gender', ctx.callbackQuery.data); await ctx.answerCbQuery(); await ctx.editMessageText('How old are you?'); return ctx.wizard.next(); },
    async (ctx) => { /* Handle age */ await db.updateProfile(ctx.from.id, 'age', parseInt(ctx.message.text)); await ctx.reply('What city are you in?'); return ctx.wizard.next(); },
    async (ctx) => { /* Handle city */ await db.updateProfile(ctx.from.id, 'city', ctx.message.text); await ctx.reply('What is your orientation?', Markup.inlineKeyboard([Markup.button.callback('Heterosexual', 'HETERO'), Markup.button.callback('Homosexual', 'HOMO'), Markup.button.callback('Bisexual', 'BI')])); return ctx.wizard.next(); },
    
    // 6. Handle Orientation, Ask for Fantasy
    async (ctx) => {
        await db.updateProfile(ctx.from.id, 'orientation', ctx.callbackQuery.data);
        await ctx.answerCbQuery();
        await ctx.editMessageText('What is your main fantasy/interest?', Markup.inlineKeyboard([
            [Markup.button.callback('BDSM', 'FANTASY_BDSM'), Markup.button.callback('Normal', 'FANTASY_NORMAL')],
            [Markup.button.callback('Cuckold', 'FANTASY_CUCKOLD'), Markup.button.callback('Other', 'FANTASY_OTHER')]
        ]));
        return ctx.wizard.next();
    },
    // 7. Handle Fantasy, Ask for Description
    async (ctx) => {
        await db.updateProfile(ctx.from.id, 'fantasy', ctx.callbackQuery.data.split('_')[1]);
        await ctx.answerCbQuery();
        await ctx.editMessageText('Great. Lastly, write a short bio about yourself.');
        return ctx.wizard.next();
    },
    // 8. Handle Description, Finish Profile
    async (ctx) => {
        await db.updateProfile(ctx.from.id, 'description', ctx.message.text);
        await db.updateProfile(ctx.from.id, 'profile_status', 'ACTIVE'); // Activate profile
        await ctx.reply('✅ Your profile is complete!');
        
        await ctx.scene.leave();
        return ctx.scene.ctx.handlers.showMainMenu(ctx);
    }
);
module.exports = profileWizard;
