// pages/airdrop.tsx
import { useState } from "react";

interface TrustLine {
  currency: string;
  issuer: string;
  balance: string;
  limit: string;
}

export default function AirdropPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [trustLines, setTrustLines] = useState<TrustLine[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [checked, setChecked] = useState(false);

  // Issuer XQN
  const XQN_ISSUER = "rahuJ7WNoKBATKEDDhx5t3Tj3f2jGhbNjd";

  const handleCheckEligibility = async () => {
    setLoading(true);
    setChecked(false);
    setErrorMessage("");
    setTrustLines([]);

    try {
      const res = await fetch(`/api/dex/get-user-trustlines?userAddress=${walletAddress}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error fetching trustlines");
      }

      setTrustLines(data.lines);
      setChecked(true);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cek apakah ada trustline currency === "XQN" & issuer === XQN_ISSUER
  const hasXQNTrustline = trustLines.some(
    (line) =>
      line.currency.toUpperCase() === "XQN" &&
      line.issuer === XQN_ISSUER
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">XQN Airdrop Snapshot</h1>

        <p className="mb-4 text-gray-700 text-center">
          Masukkan wallet address XRPL untuk cek apakah kamu sudah eligible.
        </p>

        <div className="flex mb-4">
          <input
            type="text"
            placeholder="r...."
            className="border border-gray-300 rounded-l px-3 py-2 w-full focus:outline-none"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />
          <button
            onClick={handleCheckEligibility}
            disabled={loading || !walletAddress}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r"
          >
            {loading ? "Checking..." : "Check"}
          </button>
        </div>

        {errorMessage && (
          <div className="text-red-500 text-sm text-center mb-2">{errorMessage}</div>
        )}

        {checked && (
          <div className="mt-4 text-center">
            {hasXQNTrustline ? (
              <div className="bg-green-100 text-green-700 p-3 rounded">
                <p className="font-semibold">Selamat!</p>
                <p>
                  Kamu sudah memiliki trustline <strong>XQN</strong> dengan issuer 
                  <span className="block">{XQN_ISSUER}</span>
                  <br />
                  Kamu berhak untuk mendapat airdrop pada <strong>9 February</strong>.
                </p>
                <p className="mt-2">
                  Info lebih lanjut kunjungi telegram{" "}
                  <a
                    href="https://t.me/XQNode"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    XQNode
                  </a>.
                </p>
              </div>
            ) : (
              <div className="bg-yellow-100 text-yellow-700 p-3 rounded">
                <p className="font-semibold">Oops!</p>
                <p>
                  Kamu belum set trustline ke <strong>XQN</strong> dan issuer
                  <span className="block">{XQN_ISSUER}</span>
                  Silakan set trustline terlebih dahulu agar bisa ikut snapshot airdrop.
                </p>
                <p className="mt-2">
                  Info lebih lanjut kunjungi telegram{" "}
                  <a
                    href="https://t.me/XQNode"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    XQNode
                  </a>.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
