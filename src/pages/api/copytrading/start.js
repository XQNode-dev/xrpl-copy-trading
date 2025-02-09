import { startCopyTrading } from '../../../../botManager';

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { userId, leaderAddress, copyPercentage, secret } = req.body;
    if (!userId || !leaderAddress || !copyPercentage || !secret) {
      return res.status(400).json({ error: "Missing parameters" });
    }
    try {
      const result = startCopyTrading({
        userId,
        leaderAddress,
        copyPercentage,
        secret,
        copyDestination: leaderAddress
      });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
