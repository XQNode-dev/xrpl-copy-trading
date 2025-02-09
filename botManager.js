// botManager.js
import xrpl from 'xrpl';
import { query } from './db.js';

let io = null;
export function setSocketIO(socketInstance) {
  io = socketInstance;
}

class AutoTradingBot {
  constructor(config) {
    // config: { userId, amount, strategy, secret, destination, xrplServer(optional) }
    this.config = config;
    this.interval = null;
    this.running = false;
    // Gunakan XRPL Mainnet
    this.xrplServer = config.xrplServer || "wss://s1.ripple.com";
    this.client = new xrpl.Client(this.xrplServer);
  }
  
  async start() {
    try {
      await this.client.connect();
      this.running = true;
      console.log(`AutoTradingBot (${this.config.userId}) connected to XRPL Mainnet at ${this.xrplServer}`);
      // Contoh: cek kondisi pasar dan eksekusi trade setiap 15 detik
      this.interval = setInterval(async () => {
        console.log(`AutoTradingBot: Checking market for user ${this.config.userId}`);
        try {
          const tx = await this.executeTrade();
          if (io) {
            io.emit('autotrade', { userId: this.config.userId, result: tx });
          }
          console.log(`Auto trade executed for user ${this.config.userId}:`, tx);
          // Simpan log transaksi ke database
          await query(
            'INSERT INTO trade_logs (user_id, trade_type, result) VALUES ($1, $2, $3)',
            [this.config.userId, 'auto', tx]
          );
        } catch (err) {
          console.error('Auto trade error:', err.message);
        }
      }, 15000);
    } catch (err) {
      console.error('Error connecting XRPL client for auto trading:', err.message);
    }
  }
  
  async executeTrade() {
    // Untuk demo, gunakan transaksi Payment
    const wallet = xrpl.Wallet.fromSeed(this.config.secret);
    const prepared = await this.client.autofill({
      TransactionType: "Payment",
      Account: wallet.address,
      Destination: this.config.destination,
      Amount: (this.config.amount * 1000000).toString() // konversi XRP ke drops
    });
    const signed = wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);
    return result;
  }
  
  async stop() {
    this.running = false;
    clearInterval(this.interval);
    await this.client.disconnect();
    console.log(`AutoTradingBot (${this.config.userId}) stopped.`);
  }
}

class CopyTradingBot {
  constructor(config) {
    // config: { userId, leaderAddress, copyPercentage, secret, copyDestination, xrplServer(optional) }
    this.config = config;
    this.running = false;
    this.xrplServer = config.xrplServer || "wss://s1.ripple.com";
    this.client = new xrpl.Client(this.xrplServer);
  }
  
  async start() {
    try {
      await this.client.connect();
      this.running = true;
      console.log(`CopyTradingBot (${this.config.userId}) connected to XRPL Mainnet at ${this.xrplServer}`);
      // Subscribe ke akun leader
      await this.client.request({
        command: "subscribe",
        accounts: [this.config.leaderAddress]
      });
      // Tangani event transaksi dari leader
      this.client.on('transaction', async (tx) => {
        if (tx.transaction && tx.transaction.Account === this.config.leaderAddress) {
          console.log(`CopyTradingBot: Detected transaction from leader ${this.config.leaderAddress}`);
          const leaderAmountDrops = parseInt(tx.transaction.Amount);
          const copyAmountDrops = Math.floor(leaderAmountDrops * (this.config.copyPercentage / 100));
          if (copyAmountDrops > 0) {
            try {
              const result = await this.executeCopyTrade(copyAmountDrops);
              if (io) {
                io.emit('copytrade', { followerId: this.config.userId, result });
              }
              console.log(`Copy trade executed for user ${this.config.userId}:`, result);
              // Simpan log transaksi ke database
              await query(
                'INSERT INTO trade_logs (user_id, trade_type, result) VALUES ($1, $2, $3)',
                [this.config.userId, 'copy', result]
              );
            } catch (err) {
              console.error('Copy trade error:', err.message);
            }
          }
        }
      });
    } catch (err) {
      console.error('Error connecting XRPL client for copy trading:', err.message);
    }
  }
  
  async executeCopyTrade(amountDrops) {
    const wallet = xrpl.Wallet.fromSeed(this.config.secret);
    const prepared = await this.client.autofill({
      TransactionType: "Payment",
      Account: wallet.address,
      Destination: this.config.copyDestination,
      Amount: amountDrops.toString()
    });
    const signed = wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);
    return result;
  }
  
  async stop() {
    this.running = false;
    await this.client.disconnect();
    console.log(`CopyTradingBot (${this.config.userId}) stopped.`);
  }
}

// Simpan bot aktif di memori
const activeAutoBots = {};
const activeCopyBots = {};

// Fungsi untuk memulai auto trading
export function startAutoTrading(config) {
  if (activeAutoBots[config.userId]) {
    throw new Error(`Auto trading already running for user ${config.userId}`);
  }
  const bot = new AutoTradingBot(config);
  activeAutoBots[config.userId] = bot;
  bot.start();
  // Simpan strategi ke database
  query(
    'INSERT INTO auto_trading_strategies (user_id, amount, strategy, secret, destination) VALUES ($1, $2, $3, $4, $5)',
    [config.userId, config.amount, config.strategy, config.secret, config.destination]
  ).catch(err => console.error('DB insert error:', err.message));
  return { message: "Auto trading started", userId: config.userId };
}

export function stopAutoTrading(userId) {
  if (activeAutoBots[userId]) {
    activeAutoBots[userId].stop();
    delete activeAutoBots[userId];
    return { message: "Auto trading stopped", userId };
  }
  return { message: "No active auto trading bot found for user", userId };
}

export function startCopyTrading(config) {
  if (activeCopyBots[config.userId]) {
    throw new Error(`Copy trading already running for user ${config.userId}`);
  }
  const bot = new CopyTradingBot(config);
  activeCopyBots[config.userId] = bot;
  bot.start();
  query(
    'INSERT INTO copy_trading_strategies (user_id, leader_address, copy_percentage, secret, copy_destination) VALUES ($1, $2, $3, $4, $5)',
    [config.userId, config.leaderAddress, config.copyPercentage, config.secret, config.copyDestination]
  ).catch(err => console.error('DB insert error:', err.message));
  return { message: "Copy trading started", userId: config.userId };
}

export function stopCopyTrading(userId) {
  if (activeCopyBots[userId]) {
    activeCopyBots[userId].stop();
    delete activeCopyBots[userId];
    return { message: "Copy trading stopped", userId };
  }
  return { message: "No active copy trading bot found for user", userId };
}
