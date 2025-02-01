// pages/api/dex/get-user-trustlines.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Client } from "xrpl";

// decode 40-hex => ASCII
function decodeHexToAscii(hex: string): string {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    const b = parseInt(hex.substring(i, i + 2), 16);
    if (b === 0) break;
    bytes.push(b);
  }
  return String.fromCharCode(...bytes);
}

interface TrustLine {
  currency: string;
  issuer: string;
  balance: string;
  limit: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { userAddress } = req.query;
  if (!userAddress || typeof userAddress !== "string") {
    return res.status(400).json({ success: false, message: "Missing or invalid userAddress" });
  }

  try {
    // Pakai named import Client
    const client = new Client("wss://xrplcluster.com");
    await client.connect();

    const accountLines = await client.request({
      command: "account_lines",
      account: userAddress,
      limit: 400,
    });

    await client.disconnect();

    const lines = accountLines.result.lines || [];
    const trustLines: TrustLine[] = lines.map((ln: any) => {
      let cur = ln.currency;
      // decode 40-hex => ASCII jika bukan "XRP"
      if (cur !== "XRP" && /^[A-Fa-f0-9]{2,40}$/.test(cur)) {
        const decoded = decodeHexToAscii(cur);
        if (decoded) {
          cur = decoded; // e.g. "FUZZY"
        }
      }

      return {
        currency: cur,
        issuer: ln.account,
        balance: ln.balance,
        limit: ln.limit,
      };
    });

    return res.status(200).json({ success: true, lines: trustLines });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
}
