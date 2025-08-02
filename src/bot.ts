import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import { newBillCommand, handleBillCreation, userStates, calculateBillSplit, saveBillAndShowResult } from './commands/newbill.js';
import { burmeseMessages } from './languages/burmese.js';

dotenv.config();

const botToken = process.env.BOT_TOKEN;
if (!botToken) {
  throw new Error('BOT_TOKEN is not set in .env');
}

const bot = new Telegraf(botToken);

bot.start((ctx) => {
  ctx.reply(burmeseMessages.welcome, {
    parse_mode: 'Markdown'
  });
});

// Register commands
bot.command('newbill', newBillCommand);
bot.command('single', (ctx) => {
  // Start single payer bill creation
  const userId = ctx.from?.id;
  if (userId) {
    userStates.set(userId, {
      step: 'billName',
      billData: {
        title: '',
        totalAmount: 0,
        participants: [userId],
        payments: []
      },
      billType: 'single'
    });
    ctx.reply(burmeseMessages.startBillCreation);
  }
});

bot.command('multi', (ctx) => {
  // Start multi payer bill creation
  const userId = ctx.from?.id;
  if (userId) {
    userStates.set(userId, {
      step: 'billName',
      billData: {
        title: '',
        totalAmount: 0,
        participants: [userId],
        payments: []
      },
      billType: 'multi'
    });
    ctx.reply(burmeseMessages.startBillCreation);
  }
});

bot.command('menu', (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('📊 ဘီလ်များကို ကြည့်ရှုရန်', 'view_bills')],
    [Markup.button.callback('ℹ️ အကူအညီ', 'help')]
  ]);
  
  ctx.reply(burmeseMessages.menu, {
    parse_mode: 'Markdown',
    reply_markup: keyboard.reply_markup
  });
});

// Handle button callbacks
bot.action('add_names_yes', (ctx) => {
  // Handle add names selection
  const userId = ctx.from?.id;
  if (userId) {
    const userState = userStates.get(userId);
    if (userState && userState.step === 'addNames') {
      userState.step = 'collectNames';
      ctx.reply(burmeseMessages.addNamesPrompt(userState.billData.participants.length));
    }
  }
});

bot.action('add_names_no', (ctx) => {
  // Handle add names selection
  const userId = ctx.from?.id;
  if (userId) {
    const userState = userStates.get(userId);
    if (userState && userState.step === 'addNames') {
      // Go directly to the appropriate step based on bill type
      if (userState.billType === 'single') {
        userState.step = 'paymentAmount';
        ctx.reply(burmeseMessages.singlePayerPrompt);
      } else {
        userState.step = 'individualPayments';
        ctx.reply(burmeseMessages.multiPayerPrompt);
      }
    }
  }
});

bot.action('finish_bill', async (ctx) => {
  // Handle finish bill button
  const userId = ctx.from?.id;
  if (userId) {
    const userState = userStates.get(userId);
    if (userState && userState.step === 'individualPayments') {
      // Calculate total from payments
      const totalPaid = userState.billData.payments.reduce((sum, payment) => sum + payment.amount, 0);
      userState.billData.totalAmount = totalPaid;
      
      // Calculate the bill split
      const result = calculateBillSplit(userState.billData);
      await saveBillAndShowResult(ctx, userState.billData, result);
      
      // Clear the user state
      userStates.delete(userId);
    }
  }
});





bot.action('menu', (ctx) => {
  const menuMessage = `🧾 **Shin Mal - Bill Split Calculator**

**💳 Quick Commands:**
• /single - One person paid the full amount
• /multi - Multiple people paid different amounts

**📋 Other Options:**
• View your bill history
• Get help and instructions`;
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('📊 View My Bills', 'view_bills')],
    [Markup.button.callback('ℹ️ Help', 'help')]
  ]);
  
  ctx.reply(menuMessage, {
    parse_mode: 'Markdown',
    reply_markup: keyboard.reply_markup
  });
});

bot.action('view_bills', (ctx) => {
  ctx.reply(burmeseMessages.viewBillsComingSoon);
});

bot.action('calculate_split', (ctx) => {
  ctx.reply(burmeseMessages.calculateSplitComingSoon);
});

bot.action('help', (ctx) => {
  ctx.reply(burmeseMessages.help, { parse_mode: 'Markdown' });
});

// Handle text messages for bill creation flow
bot.on('text', handleBillCreation);

// Placeholder for more commands

// Connect to MongoDB and launch bot
const startBot = async () => {
  try {
    await connectDB();
    
    // Set up persistent menu commands
    await bot.telegram.setMyCommands([
      { command: 'start', description: 'Start the bot' },
      { command: 'single', description: 'တစ်ယောက်ထဲရှင်း' },
      { command: 'multi', description: 'စုပေါင်းရှင်း' },
      { command: 'menu', description: 'Show main menu' }
    ]);

    // Set up persistent menu button
    await bot.telegram.setChatMenuButton({
      menuButton: {
        type: 'commands'
      }
    });

    bot.launch();
    console.log('Bot started successfully!');
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
};

startBot();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 