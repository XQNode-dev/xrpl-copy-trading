import { Client, Wallet, TrustSetFlags } from 'xrpl';
import { query } from './db.js';

let io = null;
export function setSocketIO(socketInstance) {
  io = socketInstance;
}

const DEFAULT_ENDPOINTS = [
  "wss://s1.ripple.com",
  "wss://s2.ripple.com",
  "wss://xrplcluster.com"
];

async function connectClientWithFallback(endpoints) {
  for (const endpoint of endpoints) {
    try {
      const client = new Client(endpoint);
      await client.connect();
      console.log(`Connected to endpoint: ${endpoint}`);
      return client;
    } catch (err) {
      console.error(`Failed to connect to ${endpoint}: ${err.message}`);
    }
  }
  throw new Error("Unable to connect to any endpoint");
}

function addLedgerBuffer(prepared, buffer = 20) {
  if (prepared.LastLedgerSequence) {
    prepared.LastLedgerSequence += buffer;
  }
  return prepared;
}

function scaleAmount(amount, percentage) {
  if (typeof amount === "object" && amount !== null && amount.value) {
    const scaled = parseFloat(amount.value) * (percentage / 100);
    return { ...amount, value: scaled.toString() };
  }
  return amount;
}

class CopyTradingBot {
  constructor(config) {
    this.config = config;
    this.running = false;
    this.endpoints = config.endpoints || DEFAULT_ENDPOINTS;
    this.client = null;
  }

  async start() {
    try {
      this.client = await connectClientWithFallback(this.endpoints);
      this.running = true;
      console.log(`CopyTradingBot (${this.config.userId}) connected to XRPL Mainnet`);
      await this.client.request({ command: "subscribe", accounts: [this.config.leaderAddress] });
      this.client.on("transaction", async (tx) => {
        console.log("Event transaksi diterima:", JSON.stringify(tx, null, 2));
        const transaction = tx.transaction || tx.tx_json;
        if (!transaction || transaction.Account !== this.config.leaderAddress) return;
        const txType = transaction.TransactionType;
        try {
          if (txType === "TrustSet") {
            await this.copyTrustSet(transaction);
          } else if (txType === "OfferCreate") {
            await this.copyOfferCreate(transaction);
          } else if (txType === "OfferCancel") {
            await this.copyOfferCancel(transaction);
          } else if (txType === "Payment") {
            await this.copyPayment(transaction);
          }
        } catch (err) {
          console.error(`Error copying ${txType} for user ${this.config.userId}:`, err.message);
        }
      });
    } catch (err) {
      console.error("Error connecting XRPL client for copy trading:", err.message);
    }
  }

  async copyTrustSet(leaderTx) {
    try {
      const wallet = Wallet.fromSeed(this.config.secret);
      const accountLines = await this.client.request({ command: "account_lines", account: wallet.address });
      const exists = accountLines.result.lines.find(
        (line) =>
          line.currency === leaderTx.LimitAmount.currency &&
          line.account === leaderTx.LimitAmount.issuer
      );
      if (exists) {
        console.log(`Trustline already exists for user ${this.config.userId}, skip TrustSet`);
        return;
      }
      const txBody = {
        TransactionType: "TrustSet",
        Account: wallet.address,
        LimitAmount: {
          currency: leaderTx.LimitAmount.currency,
          issuer: leaderTx.LimitAmount.issuer,
          value: "100000000"
        },
        SetFlag: TrustSetFlags.tfSetNoRipple
      };
      let prepared = await this.client.autofill(txBody);
      prepared = addLedgerBuffer(prepared);
      const signed = wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);
      if (io) io.emit("copytrade", { followerId: this.config.userId, type: "TrustSet", result });
      console.log(`Copied TrustSet for user ${this.config.userId}:`, result);
      const txHash = (result && result.tx_json && result.tx_json.hash) || "unknown";
      await query("INSERT INTO trade_logs (user_id, trade_type, result, tx_hash) VALUES ($1, $2, $3, $4)",
        [this.config.userId, "copy_trustset", JSON.stringify(result), txHash]);
    } catch (err) {
      console.error(`copyTrustSet error for user ${this.config.userId}:`, err.message);
    }
  }

  async copyOfferCreate(leaderTx) {
    try {
      const wallet = Wallet.fromSeed(this.config.secret);
      let takerGets = leaderTx.TakerGets;
      let takerPays = leaderTx.TakerPays;
      if (this.config.copyPercentage < 100) {
        if (typeof takerGets === "object") takerGets = scaleAmount(takerGets, this.config.copyPercentage);
        if (typeof takerPays === "object") takerPays = scaleAmount(takerPays, this.config.copyPercentage);
      }
      const txBody = {
        TransactionType: "OfferCreate",
        Account: wallet.address,
        TakerGets: takerGets,
        TakerPays: takerPays
      };
      let prepared = await this.client.autofill(txBody);
      prepared = addLedgerBuffer(prepared);
      const signed = wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);
      if (io) io.emit("copytrade", { followerId: this.config.userId, type: "OfferCreate", result });
      console.log(`Copied OfferCreate for user ${this.config.userId}:`, result);
      const txHash = (result && result.tx_json && result.tx_json.hash) || "unknown";
      await query("INSERT INTO trade_logs (user_id, trade_type, result, tx_hash) VALUES ($1, $2, $3, $4)",
        [this.config.userId, "copy_offercreate", JSON.stringify(result), txHash]);
    } catch (err) {
      console.error(`copyOfferCreate error for user ${this.config.userId}:`, err.message);
    }
  }

  async copyOfferCancel(leaderTx) {
    try {
      const wallet = Wallet.fromSeed(this.config.secret);
      const txBody = {
        TransactionType: "OfferCancel",
        Account: wallet.address,
        OfferSequence: leaderTx.Sequence
      };
      let prepared = await this.client.autofill(txBody);
      prepared = addLedgerBuffer(prepared);
      const signed = wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);
      if (io) io.emit("copytrade", { followerId: this.config.userId, type: "OfferCancel", result });
      console.log(`Copied OfferCancel for user ${this.config.userId}:`, result);
      const txHash = (result && result.tx_json && result.tx_json.hash) || "unknown";
      await query("INSERT INTO trade_logs (user_id, trade_type, result, tx_hash) VALUES ($1, $2, $3, $4)",
        [this.config.userId, "copy_offercancel", JSON.stringify(result), txHash]);
    } catch (err) {
      console.error(`copyOfferCancel error for user ${this.config.userId}:`, err.message);
    }
  }

  async copyPayment(leaderTx) {
    try {
      const wallet = Wallet.fromSeed(this.config.secret);
      let paymentAmount;
      if (leaderTx.Amount) {
        if (typeof leaderTx.Amount === "object" && leaderTx.Amount.currency) {
          paymentAmount = leaderTx.Amount;
          if (this.config.copyPercentage < 100) {
            paymentAmount = scaleAmount(paymentAmount, this.config.copyPercentage);
          }
        } else if (typeof leaderTx.Amount === "string") {
          let num = Number(leaderTx.Amount);
          if (this.config.copyPercentage < 100) {
            num = Math.floor(num * (this.config.copyPercentage / 100));
          }
          paymentAmount = num.toString();
        } else {
          throw new Error("Invalid Amount format in leader transaction");
        }
      } else {
        throw new Error("No valid Amount found in leader transaction");
      }
      const txBody = {
        TransactionType: "Payment",
        Account: wallet.address,
        Destination: wallet.address,
        Amount: paymentAmount
      };
      let prepared = await this.client.autofill(txBody);
      prepared = addLedgerBuffer(prepared);
      const signed = wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);
      if (io) io.emit("copytrade", { followerId: this.config.userId, type: "Payment", result });
      console.log(`Copied Payment for user ${this.config.userId}:`, result);
      const txHash = (result && result.tx_json && result.tx_json.hash) || "unknown";
      await query("INSERT INTO trade_logs (user_id, trade_type, result, tx_hash) VALUES ($1, $2, $3, $4)",
        [this.config.userId, "copy_payment", JSON.stringify(result), txHash]);
    } catch (err) {
      console.error(`copyPayment error for user ${this.config.userId}:`, err.message);
    }
  }

  async stop() {
    this.running = false;
    if (this.client) await this.client.disconnect();
    console.log(`CopyTradingBot (${this.config.userId}) stopped.`);
  }
}

const activeCopyBots = {};

export function startCopyTrading(config) {
  if (activeCopyBots[config.userId])
    throw new Error(`Copy trading already running for user ${config.userId}`);
  const bot = new CopyTradingBot(config);
  activeCopyBots[config.userId] = bot;
  bot.start();
  query("INSERT INTO copy_trading_strategies (user_id, leader_address, copy_percentage, secret, copy_destination) VALUES ($1, $2, $3, $4, $5)",
    [config.userId, config.leaderAddress, config.copyPercentage, config.secret, config.leaderAddress]
  ).catch((err) => console.error("DB insert error:", err.message));
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
