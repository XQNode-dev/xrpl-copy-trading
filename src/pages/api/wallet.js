// pages/api/wallet.js
import { Client } from 'xrpl';

export default async function handler(req, res) {
  const { address } = req.query;
  if (!address) return res.status(400).json({ error: 'address required' });
  const client = new Client("wss://s1.ripple.com");
  try {
    await client.connect();
    const accountInfo = await client.request({
      command: "account_info",
      account: address,
      ledger_index: "validated"
    });
    await client.disconnect();
    res.status(200).json(accountInfo);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
