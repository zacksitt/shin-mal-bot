import { Context, Markup } from 'telegraf';
import { Bill } from '../models/index.js';
import { burmeseMessages } from '../languages/burmese.js';

interface BillData {
  title: string;
  totalAmount: number;
  participants: number[];
  participantNames?: string[];
  payments: { userId: number; amount: number }[];
}

// Simple in-memory storage for demo (in production, use database)
export const userStates = new Map<number, {
  step: string;
  billData: BillData;
  billType?: 'single' | 'multi';
}>();

export const newBillCommand = async (ctx: Context) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) {
      return ctx.reply(burmeseMessages.unableToIdentify);
    }

    // Start the bill creation process
    ctx.reply(burmeseMessages.startBillCreation);
    
    // Store the user's state
    userStates.set(userId, {
      step: 'billName',
      billData: {
        title: '',
        totalAmount: 0,
        participants: [userId],
        payments: []
      }
    });

  } catch (error) {
    console.error('Error starting bill creation:', error);
    ctx.reply(burmeseMessages.errorCreatingBill);
  }
};

// Handle text messages for bill creation flow
export const handleBillCreation = async (ctx: Context) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) return;

    const userState = userStates.get(userId);
    if (!userState) return;

    const message = ctx.message && 'text' in ctx.message ? ctx.message.text : undefined;
    if (!message) return;

    console.log('Current step:', userState.step, 'Message:', message);
    switch (userState.step) {
      case 'billName':
        userState.billData.title = message;
        userState.step = 'totalPeople';
        ctx.reply(burmeseMessages.billNameConfirmed(message));
        break;

      case 'totalPeople':
        const peopleCount = parseInt(message);
        console.log('People count input:', message, 'Parsed:', peopleCount);
        
        if (isNaN(peopleCount) || peopleCount < 1) {
          console.log('Invalid people count - too low or NaN');
          ctx.reply(burmeseMessages.invalidPeopleCount);
          return;
        }
        if (peopleCount > 10) {
          console.log('Invalid people count - too high:', peopleCount);
          ctx.reply(burmeseMessages.maxPeopleExceeded);
          return;
        }
        console.log('Valid people count:', peopleCount);
        userState.billData.participants = Array.from({ length: peopleCount }, (_, i) => userId + i);
        userState.step = 'addNames';
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('✅ ဟုတ်ကဲ့၊ အမည်များ ထည့်သွင်းပါ', 'add_names_yes')],
          [Markup.button.callback('❌ မဟုတ်ပါ၊ အမည်မသိ ထားပါ', 'add_names_no')]
        ]);
        ctx.reply(burmeseMessages.peopleCountConfirmed(peopleCount), {
          reply_markup: keyboard.reply_markup
        });
        break;

      case 'addNames':
        if (message === 'add_names_yes') {
          userState.step = 'collectNames';
          ctx.reply(burmeseMessages.addNamesPrompt(userState.billData.participants.length));
        } else if (message === 'add_names_no') {
          // Go directly to the appropriate step based on bill type
          if (userState.billType === 'single') {
            userState.step = 'paymentAmount';
            ctx.reply(burmeseMessages.singlePayerPrompt);
          } else {
            userState.step = 'individualPayments';
            ctx.reply(burmeseMessages.multiPayerPrompt);
          }
        } else {
          ctx.reply(burmeseMessages.useButtons);
          return;
        }
        break;

      case 'collectNames':
        const names = message.split(',').map(name => name.trim()).filter(name => name.length > 0);
        if (names.length !== userState.billData.participants.length) {
          ctx.reply(burmeseMessages.namesError(userState.billData.participants.length));
          return;
        }
        userState.billData.participantNames = names;
        // Go directly to the appropriate step based on bill type
        if (userState.billType === 'single') {
          userState.step = 'paymentAmount';
          ctx.reply(burmeseMessages.namesAddedSingle(names.join(', ')));
        } else {
          userState.step = 'individualPayments';
          ctx.reply(burmeseMessages.namesAddedMulti(names.join(', ')));
        }
        break;

      case 'paymentAmount':
        const totalAmount = parseFloat(message);
        if (isNaN(totalAmount) || totalAmount <= 0) {
          ctx.reply(burmeseMessages.invalidAmount);
          return;
        }
        userState.billData.totalAmount = totalAmount;
        userState.step = 'singlePayer';
        
        const participantNames = userState.billData.participantNames;
        const payerOptions = participantNames 
          ? participantNames.map((name, index) => `${index + 1}. ${name}`).join('\n')
          : Array.from({ length: userState.billData.participants.length }, (_, i) => `${i + 1}. လူ ${i + 1}`).join('\n');
        
        ctx.reply(`✅ **စုစုပေါင်း ပမာဏ:** $${totalAmount.toFixed(2)}

**အဆင့် ၅:** $${totalAmount.toFixed(2)} အပြည့် ဘယ်သူက ပေးထားလဲ?

${payerOptions}

*လူနံပါတ်ကို ရိုက်ပါ (၁-${userState.billData.participants.length})*`);
        break;

      case 'singlePayer':
        const payerNumber = parseInt(message);
        if (isNaN(payerNumber) || payerNumber < 1 || payerNumber > userState.billData.participants.length) {
          ctx.reply(burmeseMessages.invalidPersonNumber(userState.billData.participants.length));
          return;
        }
        
        // Set up payments: one person paid everything, others paid 0
        for (let i = 0; i < userState.billData.participants.length; i++) {
          const participantId = userState.billData.participants[i];
          if (participantId !== undefined) {
            userState.billData.payments.push({
              userId: participantId,
              amount: i === payerNumber - 1 ? userState.billData.totalAmount : 0
            });
          }
        }
        
        // Calculate and show results
        const result = calculateBillSplit(userState.billData);
        await saveBillAndShowResult(ctx, userState.billData, result);
        userStates.delete(userId);
        break;

      case 'individualPayments':
        const payment = parseFloat(message);
        if (isNaN(payment) || payment < 0) {
          ctx.reply(burmeseMessages.invalidPayment);
          return;
        }

        const participantId = userState.billData.participants[userState.billData.payments.length];
        if (participantId !== undefined) {
          userState.billData.payments.push({
            userId: participantId,
            amount: payment
          });
        }

        if (userState.billData.payments.length < userState.billData.participants.length) {
          const nextPerson = userState.billData.payments.length + 1;
          const participantNames = userState.billData.participantNames;
          const personName = participantNames ? participantNames[nextPerson - 1] : `လူ ${nextPerson}`;
          
          // Add finish button for early completion
          const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback(burmeseMessages.finishBillButton, 'finish_bill')]
          ]);
          
          ctx.reply(`✅ **${personName}:** ဘယ်လောက် ပေးထားလဲ?
*ပမာဏကို ရိုက်ပါ (ဥပမာ: ၂၅.၀၀)*`, {
            reply_markup: keyboard.reply_markup
          });
        } else {
          // Calculate total from payments
          const totalPaid = userState.billData.payments.reduce((sum, payment) => sum + payment.amount, 0);
          userState.billData.totalAmount = totalPaid;
          
          // Calculate the bill split
          const result = calculateBillSplit(userState.billData);
          await saveBillAndShowResult(ctx, userState.billData, result);
          
          // Clear the user state
          userStates.delete(userId);
        }
        break;
    }
  } catch (error) {
    console.error('Error in bill creation flow:', error);
    ctx.reply(burmeseMessages.errorProcessingInput);
  }
};

export function calculateBillSplit(billData: BillData) {
  const totalPaid = billData.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalAmount = billData.totalAmount;
  const perPerson = totalAmount / billData.participants.length;
  
  // Create a map of payments by participant ID
  const paymentMap = new Map();
  billData.payments.forEach(payment => {
    paymentMap.set(payment.userId, payment.amount);
  });
  
  // Process all participants, including those who haven't paid
  const results = billData.participants.map((participantId, index) => {
    const personNumber = index + 1;
    const shouldPay = perPerson;
    const paid = paymentMap.get(participantId) || 0; // Default to 0 if no payment
    const difference = paid - shouldPay;
    
    return {
      personNumber,
      paid,
      shouldPay,
      difference,
      status: difference > 0 ? 'overpaid' : difference < 0 ? 'underpaid' : 'exact'
    };
  });

  return {
    totalAmount,
    totalPaid,
    perPerson,
    results,
    summary: {
      overpaid: results.filter(r => r.status === 'overpaid'),
      underpaid: results.filter(r => r.status === 'underpaid'),
      exact: results.filter(r => r.status === 'exact')
    }
  };
}

export async function saveBillAndShowResult(ctx: Context, billData: BillData, result: any) {
  try {
    // Save to database
    const bill = new Bill({
      title: billData.title,
      totalAmount: billData.totalAmount,
      participants: billData.participants,
      createdBy: ctx.from?.id
    });
    await bill.save();

    // Create result message
    let message = burmeseMessages.billResults(billData.title, result.totalAmount, result.perPerson);
    
    // Show paid people and their amounts
    const paidPeople = result.results.filter((r: any) => r.paid > 0);
    if (paidPeople.length > 0) {
      message += `${burmeseMessages.paidPeopleList}\n`;
      paidPeople.forEach((r: any, index: number) => {
        const personName = billData.participantNames ? billData.participantNames[r.personNumber - 1] : `လူ ${r.personNumber}`;
        message += `${index + 1}. **${personName}:** $${r.paid.toFixed(2)}\n`;
      });
      message += `\n`;
    }
    
    // Calculate transfers needed
    const transfers = calculateTransfers(result.results);
    

    
    // Always show transfers section header
    message += `${burmeseMessages.transfersNeeded}\n\n`;
    
    if (transfers.length > 0) {
      transfers.forEach((transfer: any, index: number) => {
        const fromName = billData.participantNames ? billData.participantNames[transfer.from - 1] : `လူ ${transfer.from}`;
        const toName = billData.participantNames ? billData.participantNames[transfer.to - 1] : `လူ ${transfer.to}`;
        if (fromName && toName) {
          message += `${index + 1}. ${burmeseMessages.transferFormat(fromName, toName, transfer.amount)}\n`;
        }
      });
      message += `\n`;
    } else {
      message += burmeseMessages.noTransfersNeeded;
    }

    ctx.reply(message, { 
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error saving bill:', error);
    ctx.reply(burmeseMessages.errorSavingBill + '\n\n' + JSON.stringify(result, null, 2));
  }
}

function calculateTransfers(results: any[]) {
  const transfers: any[] = [];
  const balances = results.map((r, index) => ({
    personNumber: index + 1,
    balance: r.difference
  }));

  // Sort by balance (negative first, then positive)
  const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);
  const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    if (!debtor || !creditor) break;

    const transferAmount = Math.min(Math.abs(debtor.balance), creditor.balance);

    if (transferAmount > 0.01) { // Only show transfers > $0.01
      transfers.push({
        from: debtor.personNumber,
        to: creditor.personNumber,
        amount: transferAmount
      });
    }

    debtor.balance += transferAmount;
    creditor.balance -= transferAmount;

    if (Math.abs(debtor.balance) < 0.01) debtorIndex++;
    if (creditor.balance < 0.01) creditorIndex++;
  }

  return transfers;
} 