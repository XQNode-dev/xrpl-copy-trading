// pages/api/transactions.js
import { Client } from 'xrpl';

export default async function handler(req, res) {
  try {
    const client = new Client("wss://s1.ripple.com");
    await client.connect();

    const ledger = await client.request({
      command: "ledger",
      ledger_index: "validated",
      transactions: true,
      expand: true,
    });

    await client.disconnect();
    res.status(200).json(ledger);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
