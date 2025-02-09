// pages/api/autotrading/start.js
import { startAutoTrading } from '../../../botManager.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { userId, amount, strategy, secret, destination } = req.body;
    if (!userId || !amount || !strategy || !secret || !destination) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
    try {
      const result = startAutoTrading({ userId, amount, strategy, secret, destination });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
