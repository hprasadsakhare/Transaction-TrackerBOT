import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import TelegramBot from "node-telegram-bot-api";
import Web3 from "web3";

// Load environment variables from .env file
dotenv.config();

async function main() {
  const app = express();
  const port = 3000;

  // Parse the request body as JSON
  app.use(bodyParser.json());

  // Create a TelegramBot instance with your bot token
  const botToken = process.env.BOT_TOKEN;
  const bot = new TelegramBot(botToken, { polling: true });
  const web3 = new Web3(
    `https://rpc.testnet.rootstock.io/${process.env.RSK_API_KEY}`
  );

  const commands = {
    start: '/start - Start the bot',
    balance: '/balance <address> - Check the balance of a wallet',
    transactions: '/transactions <address> - Get recent transactions of a wallet',
    latestblock: '/latestblock - Get the latest block number',
    help: '/help - Show this help message',
    gasprice: '/gasprice - Get the current gas price',
  };

  const sendHelpMessage = (chatId) => {
    const helpMessage = `You can use the following commands:\n` +
      Object.values(commands).join('\n');
    bot.sendMessage(chatId, helpMessage);
  };

  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    sendHelpMessage(chatId);
  });

   // Handle /start 
   bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Hello! Welcome to the Transaction-TrackerBOT.`); 
  });


  // Handle /balance command
  bot.onText(/\/balance (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const walletAddress = match[1]; // Extract the address from the command

    try {
      const balance = await web3.eth.getBalance(walletAddress);
      bot.sendMessage(chatId, `The balance of the address ${walletAddress} is ${web3.utils.fromWei(balance, 'ether')} ETH.`);
    } catch (error) {
      bot.sendMessage(chatId, 'Failed to fetch the balance. Please try again later.');
      console.error(error);
    }
    
  });
  
  // Handle /gasprice command
  bot.onText(/\/gasprice/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const gasPrice = await web3.eth.getGasPrice();
      const gasInEth = web3.utils.fromWei(gasPrice, "ether");
      bot.sendMessage(chatId, `The current gas price is ${gasInEth} eth.`);
    } catch (error) {
      bot.sendMessage(chatId, `Failed to fetch gas price. Please try again later.`);
      console.error(error);
    }
  });

  // Handle /transactions command
  bot.onText(/\/transactions (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const walletAddress = match[1];

   if (!walletAddress) {
     bot.sendMessage(chatId, 'Please provide a valid address.');
     return;
   }

    try {
      const transactionCount = await web3.eth.getTransactionCount(walletAddress);
      bot.sendMessage(chatId, `${walletAddress} has made ${transactionCount} transactions.`);
    } catch (error) {
      bot.sendMessage(chatId, `Failed to fetch transactions for ${walletAddress}. Please try again later.`);
      console.error(error);
    }
  });

  // Handle /latestblock command
  bot.onText(/\/latestblock/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const latestBlock = await web3.eth.getBlockNumber();
      bot.sendMessage(chatId, `The latest block number is ${latestBlock}.`);
    } catch (error) {
      bot.sendMessage(chatId, 'Failed to fetch the latest block number. Please try again later.');
      console.error(error);
    }
  });

  // Handle unrecognized commands
  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!Object.keys(commands).some(cmd => text.startsWith(`/${cmd}`))) {
      bot.sendMessage(chatId, `Sorry, I didn't recognize that command. Please use the following commands:\n` +
        Object.values(commands).join('\n'));
    }
  });

  // Start the Express server
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

main().catch(console.error);