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

  // XQN Issuer
  const XQN_ISSUER = "rahuJ7WNoKBATKEDDhx5t3Tj3f2jGhbNjd";

  const handleCheckEligibility = async () => {
    setLoading(true);
    setChecked(false);
    setErrorMessage("");
    setTrustLines([]);

    try {
      const res = await fetch(`/api/get-user-trustlines?userAddress=${walletAddress}`);
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

  // Check if the XQN trustline exists with the specified issuer
  const hasXQNTrustline = trustLines.some(
    (line) =>
      line.currency.toUpperCase() === "XQN" &&
      line.issuer === XQN_ISSUER
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-black to-purple-900 animate-gradient-xy opacity-70"></div>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      <div className="relative z-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full transform transition duration-500 hover:scale-105">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-center text-white mb-4 sm:mb-6 tracking-widest drop-shadow-lg">
          XQN AIRDROP
        </h1>
        <p className="text-center text-gray-300 mb-4 sm:mb-6">
          Enter your XRPL wallet address to check XQN airdrop eligibility.
        </p>

        {/* Container input & button */}
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <input
            type="text"
            placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXX"
            className="
              flex-1 min-w-0
              bg-transparent border border-white/30 
              rounded-lg sm:rounded-l-lg sm:rounded-r-none 
              px-4 py-3 text-white placeholder-white 
              focus:outline-none focus:ring-2 focus:ring-purple-500 
            "
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />
          <button
            onClick={handleCheckEligibility}
            disabled={loading || !walletAddress}
            className="
              w-full sm:w-auto 
              bg-purple-600 hover:bg-purple-700 text-white font-semibold
              px-6 py-3 rounded-lg sm:rounded-l-none sm:rounded-r-lg
              transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500
            "
          >
            {loading ? "Checking..." : "Check"}
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 text-center text-red-400 font-medium">
            {errorMessage}
          </div>
        )}

        {checked && (
          <div className="mt-6">
            {hasXQNTrustline ? (
              <div className="bg-green-800 bg-opacity-50 border border-green-600 text-green-200 p-4 rounded-lg shadow-inner">
                <p className="font-bold text-lg mb-2">CONGRATULATIONS!</p>
                <p className="text-sm">
                  XQN trustline with issuer{" "}
                  <span className="font-mono text-xs break-all">
                    {XQN_ISSUER}
                  </span>{" "}
                  detected.
                </p>
                <p className="text-sm mt-2">
                  Airdrop will be distributed on{" "}
                  <span className="font-bold">9 February</span>.
                </p>
                <p className="text-sm mt-2">
                  For more information, visit our Telegram{" "}
                  <a
                    href="https://t.me/xrplnode"
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-purple-300 hover:text-purple-400"
                  >
                    XRPLNode
                  </a>.
                </p>
              </div>
            ) : (
              <div className="bg-yellow-800 bg-opacity-50 border border-yellow-600 text-yellow-200 p-4 rounded-lg shadow-inner">
                <p className="font-bold text-lg mb-2">OOPS!</p>
                <p className="text-sm">
                  You haven't set the XQN trustline with issuer{" "}
                  <span className="font-mono text-xs break-all">
                    {XQN_ISSUER}
                  </span>{" "}
                  yet.
                </p>
                <p className="text-sm mt-2">
                  Please set the trustline first to be eligible for the snapshot airdrop.
                </p>
                <p className="text-sm mt-2">
                  For more information, visit our Telegram{" "}
                  <a
                    href="https://t.me/xrplnode"
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-purple-300 hover:text-purple-400"
                  >
                    XRPLNode
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
