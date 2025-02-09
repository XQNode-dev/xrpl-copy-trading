import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import io from 'socket.io-client'
import { Line } from 'react-chartjs-2'
import { Chart, registerables } from 'chart.js'
import CryptoJS from 'crypto-js'

// Register chart.js components
Chart.register(...registerables)

// Initialize socket client (only if window is defined)
let socket
if (typeof window !== 'undefined') {
  socket = io({ path: '/socket.io' });
}

/* -------------------------------------------------------------------------- */
/*                       AES ENCRYPTION HELPER FUNCTIONS                      */
/* -------------------------------------------------------------------------- */
const ENCRYPTION_KEY = "SUPER_SECRET_PASSPHRASE" // You should move this to an environment variable

function encryptSeed(seed) {
  if (!seed) return ""
  return CryptoJS.AES.encrypt(seed, ENCRYPTION_KEY).toString()
}

function decryptSeed(ciphertext) {
  if (!ciphertext) return ""
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

/* -------------------------------------------------------------------------- */
/*                               UTILITY FUNCTIONS                            */
/* -------------------------------------------------------------------------- */
function formatNumber(num, decimals = 2) {
  if (!num || isNaN(num)) return 'N/A'
  return parseFloat(num)
    .toFixed(decimals)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function dropsToXRP(drops) {
  if (!drops) return "N/A"
  const xrp = parseFloat(drops) / 1000000
  return formatNumber(xrp, 2)
}

/* -------------------------------------------------------------------------- */
/*                           COLLAPSIBLE COMPONENT                            */
/* -------------------------------------------------------------------------- */
function RawDataCollapsible({ data, title }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-slate-800 rounded p-4 border border-teal-600 mb-6 shadow-xl">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <h3 className="font-bold text-xl text-teal-300">{title}</h3>
        <span className="text-teal-300 font-bold text-2xl">
          {open ? "▲" : "▼"}
        </span>
      </div>
      {open && (
        <pre className="mt-4 text-sm max-h-64 overflow-auto bg-slate-900 p-4 rounded text-gray-300">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   MAIN PAGE                                */
/* -------------------------------------------------------------------------- */
export default function Home() {
  // State: ledger data
  const [ledgerData, setLedgerData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // State: Auto trading form
  const [autoForm, setAutoForm] = useState({
    userId: '',
    amount: '',
    strategy: 'Scalping',
    secret: '',
    destination: ''
  })
  const [autoMsg, setAutoMsg] = useState('')

  // State: Copy trading form
  const [copyForm, setCopyForm] = useState({
    userId: '',
    leaderAddress: '',
    copyPercentage: '',
    secret: '',
    copyDestination: ''
  })
  const [copyMsg, setCopyMsg] = useState('')

  // State: notifications
  const [notifications, setNotifications] = useState([])

  // State: Chart
  const [chartData, setChartData] = useState(null)
  const [currentPrice, setCurrentPrice] = useState(null)

  // State: wallet modal
  const [walletModal, setWalletModal] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletSecret, setWalletSecret] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [walletBalance, setWalletBalance] = useState('')

  // State: mobile menu
  const [menuOpen, setMenuOpen] = useState(false)

  /* ------------------------------------------------------------------------ */
  /*                         SOCKET EVENTS LISTENER                           */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (socket) {
      socket.on('autotrade', (data) => {
        setNotifications((prev) => [
          { type: 'Auto Trade', message: JSON.stringify(data) },
          ...prev
        ])
      })
      socket.on('copytrade', (data) => {
        setNotifications((prev) => [
          { type: 'Copy Trade', message: JSON.stringify(data) },
          ...prev
        ])
      })
    }
    return () => {
      if (socket) socket.off()
    }
  }, [])

  /* ------------------------------------------------------------------------ */
  /*                          FETCH XRPL LEDGER DATA                          */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    async function fetchLedger() {
      try {
        const res = await fetch('/api/transactions')
        const data = await res.json()
        setLedgerData(data)
        setLoading(false)
      } catch (err) {
        setError(err)
        setLoading(false)
      }
    }
    fetchLedger()
  }, [])

  /* ------------------------------------------------------------------------ */
  /*                        FETCH CHART DATA (BINANCE)                        */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    async function fetchChartData() {
      try {
        const res = await fetch(
          'https://api.binance.com/api/v3/klines?symbol=XRPUSDT&interval=1h&limit=24'
        )
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        const data = await res.json()
        if (!data || !Array.isArray(data)) {
          throw new Error("Invalid data from Binance")
        }
        const labels = data.map(item => {
          const date = new Date(item[0])
          return `${date.getHours()}:${("0" + date.getMinutes()).slice(-2)}`
        })
        const prices = data.map(item => parseFloat(item[4]))

        setCurrentPrice(prices[prices.length - 1])
        setChartData({
          labels,
          datasets: [
            {
              label: 'XRP Price (USDT)',
              data: prices,
              fill: false,
              borderColor: '#2dd4bf',
              backgroundColor: '#2dd4bf',
              tension: 0.2
            }
          ]
        })
      } catch (err) {
        console.error('Chart fetch error:', err)
        setChartData({ labels: [], datasets: [] })
      }
    }
    fetchChartData()
  }, [])

  /* ------------------------------------------------------------------------ */
  /*                          HANDLE WALLET CONNECT                           */
  /* ------------------------------------------------------------------------ */
  const handleWalletConnect = async (e) => {
    e.preventDefault()
    try {
      // Encrypt seed on the client
      const encryptedSeed = encryptSeed(walletSecret.trim())

      // Demonstration: Decrypt again on the client to create an XRPL wallet 
      // (this is not ideal—on production, decryption should happen on the server).
      const bytes = CryptoJS.AES.decrypt(encryptedSeed, ENCRYPTION_KEY)
      const decryptedSeed = bytes.toString(CryptoJS.enc.Utf8)

      // Use xrpl library to create a wallet
      const xrpl = await import('xrpl')
      const wallet = xrpl.Wallet.fromSeed(decryptedSeed)
      setWalletAddress(wallet.address)

      // Fetch balance info from server (custom endpoint)
      const res = await fetch(`/api/wallet?address=${wallet.address}`)
      const data = await res.json()
      const balanceDrops = data.result?.account_data?.Balance
      setWalletBalance(dropsToXRP(balanceDrops))

      setWalletConnected(true)
      setWalletModal(false)
    } catch (err) {
      console.error('Wallet connect error:', err.message)
      alert('Failed to connect wallet. Please check your seed.')
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                        HANDLE AUTO TRADE SUBMIT                          */
  /* ------------------------------------------------------------------------ */
  const handleAutoSubmit = async (e) => {
    e.preventDefault()
    setAutoMsg('')
    try {
      // Encrypt seed before sending it to the server
      const encryptedSeed = encryptSeed(autoForm.secret.trim())

      // Prepare payload with the encrypted seed
      const payload = {
        ...autoForm,
        secret: encryptedSeed
      }

      const res = await fetch('/api/autotrading/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok) {
        setAutoMsg(`Success: ${data.message}`)
      } else {
        setAutoMsg(`Error: ${data.error}`)
      }
    } catch (err) {
      setAutoMsg(`Error: ${err.message}`)
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                        HANDLE COPY TRADE SUBMIT                          */
  /* ------------------------------------------------------------------------ */
  const handleCopySubmit = async (e) => {
    e.preventDefault()
    setCopyMsg('')
    try {
      // Encrypt seed
      const encryptedSeed = encryptSeed(copyForm.secret.trim())

      const payload = {
        ...copyForm,
        secret: encryptedSeed
      }

      const res = await fetch('/api/copytrading/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok) {
        setCopyMsg(`Success: ${data.message}`)
      } else {
        setCopyMsg(`Error: ${data.error}`)
      }
    } catch (err) {
      setCopyMsg(`Error: ${err.message}`)
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                               RENDERING UI                               */
  /* ------------------------------------------------------------------------ */
  const ledger = ledgerData?.result?.ledger
  const ledgerIndex = ledger?.ledger_index || "N/A"
  const totalCoins = ledger?.total_coins ? dropsToXRP(ledger.total_coins) : "N/A"
  const txList = ledger?.transactions || []

  // Dummy pairs for demonstration
  const dummyPairs = [
    { pair: 'XRP/USDT', lastPrice: '0.39', volume: '2,450,000' },
    { pair: 'XRP/BTC', lastPrice: '0.000016', volume: '1,120,000' },
    { pair: 'XRP/ETH', lastPrice: '0.00025', volume: '980,000' },
    { pair: 'XRP/SOL', lastPrice: '0.030', volume: '750,000' },
    { pair: 'XRP/BNB', lastPrice: '0.0012', volume: '620,000' },
  ]

  return (
    <>
      <Head>
        <title>XQNode - AUTO TRADE App - development</title>
        <meta
          name="description"
          content="Production-ready XRPL auto/copy trading UI"
        />
      </Head>

      <div className="min-h-screen flex flex-col bg-slate-900 text-white">
        {/* ---------------------------- HEADER / NAV --------------------------- */}
        <header className="bg-slate-800/90 shadow-2xl w-full px-4 py-3 md:px-8 md:py-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide text-teal-400 uppercase drop-shadow-2xl transition-all hover:scale-105 hover:text-teal-200">
                XQNode - XRPL AUTO TRADE
              </h1>
            </div>
            <div className="hidden md:block">
              {walletConnected ? (
                <span className="text-md md:text-lg text-teal-300 font-medium">
                  {walletAddress} | Balance: {walletBalance} XRP
                </span>
              ) : (
                <button
                  onClick={() => setWalletModal(true)}
                  className="bg-gradient-to-r from-teal-600 to-teal-500 px-4 py-2 rounded-md text-sm md:text-base font-semibold text-white shadow-lg transition-transform transform hover:scale-105 hover:shadow-teal-500/50"
                >
                  Connect Wallet
                </button>
              )}
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-teal-300 focus:outline-none"
              >
                {menuOpen ? (
                  // Close (X) icon
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  // Hamburger icon
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Collapsible mobile navigation */}
          <nav
            className={`flex flex-col md:flex-row md:items-center gap-4 mt-4 md:mt-2 transition-all duration-300 
            ${menuOpen ? 'block' : 'hidden md:flex'}`}
          >
            <div className="flex flex-col md:flex-row gap-2 md:gap-6 text-base md:text-lg font-semibold">
              <a
                href="#dashboard"
                className="text-gray-300 hover:text-teal-400 transition px-1 py-1"
              >
                Dashboard
              </a>
              <a
                href="#autotrading"
                className="text-gray-300 hover:text-teal-400 transition px-1 py-1"
              >
                Auto Trading
              </a>
              <a
                href="#copytrading"
                className="text-gray-300 hover:text-teal-400 transition px-1 py-1"
              >
                Copy Trading
              </a>
              <a
                href="#latest-transactions"
                className="text-gray-300 hover:text-teal-400 transition px-1 py-1"
              >
                TX
              </a>
              <a
                href="#rawdata"
                className="text-gray-300 hover:text-teal-400 transition px-1 py-1"
              >
                Raw Data
              </a>
            </div>
            <div className="md:hidden mt-2">
              {walletConnected ? (
                <span className="text-sm text-teal-300 font-medium">
                  {walletAddress} | Balance: {walletBalance} XRP
                </span>
              ) : (
                <button
                  onClick={() => setWalletModal(true)}
                  className="bg-gradient-to-r from-teal-600 to-teal-500 px-4 py-2 rounded-md text-sm font-semibold text-white shadow-lg transition-transform transform hover:scale-105 hover:shadow-teal-500/50"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </nav>
        </header>

        {/* ------------------------ WALLET CONNECT MODAL ----------------------- */}
        {walletModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
            <div className="bg-slate-800 p-6 md:p-8 rounded-lg shadow-2xl w-11/12 md:w-96">
              <h2 className="text-2xl font-bold mb-6 text-teal-300 text-center tracking-wider">
                Connect Your Wallet
              </h2>
              <form onSubmit={handleWalletConnect}>
                <div className="mb-6">
                  <label className="block text-lg text-gray-300 mb-2">
                    Wallet Secret (Seed)
                  </label>
                  <input
                    type="text"
                    value={walletSecret}
                    onChange={(e) => setWalletSecret(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="snXXXXXXXXXXXX"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setWalletModal(false)}
                    className="px-4 py-2 bg-red-600 text-white rounded text-lg font-bold hover:bg-red-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-gray-900 rounded text-lg font-bold"
                  >
                    Connect
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------ MAIN CONTENT ------------------------- */}
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-10">
            {/* ------------------------- HERO SECTION ------------------------- */}
            <section className="bg-[radial-gradient(circle_at_top_left,_#0f172a,_#0f172a,_#1e293b_50%)] rounded-xl px-6 py-16 md:px-16 md:py-20 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900 opacity-50 pointer-events-none"></div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-teal-300 z-10">
                Join the Next Generation of XRPL Trading
              </h2>
              <p className="mt-4 text-gray-200 text-lg md:text-xl max-w-3xl z-10">
                Elevate your DeFi experience with automated strategies and real-time insights. 
                Fast, secure, and built for the future.
              </p>
              <div className="mt-8 z-10">
                {!walletConnected && (
                  <button
                    onClick={() => setWalletModal(true)}
                    className="bg-teal-600 px-6 py-3 rounded-full text-white font-bold text-lg shadow-md transform transition hover:scale-105 hover:bg-teal-500"
                  >
                    Connect Your Wallet Now
                  </button>
                )}
              </div>
            </section>

            {/* ------------------ LOADING & ERROR STATES ---------------------- */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-teal-400"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-2xl">{error.message}</div>
            ) : (
              <>
                {/* --------------------- DASHBOARD SECTION --------------------- */}
                <section id="dashboard">
                  <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
                  <div className="bg-slate-800 p-4 md:p-5 rounded-lg border border-teal-600 mb-6 shadow-xl">
                    <p className="text-teal-300 font-semibold">
                      WARNING: This application is still under development. Please do not share any real sensitive data.
                    </p>
                    <p className="text-gray-400 mt-1">
                      For testing, consider using XRPL Testnet or a dummy seed.
                    </p>
                  </div>
                  <div className="bg-slate-800 p-6 md:p-8 rounded-lg shadow-2xl mb-6 hover:shadow-teal-600/40 transition-shadow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div className="flex flex-col">
                        <span className="text-lg text-gray-300">
                          Ledger Index
                        </span>
                        <span className="text-4xl font-extrabold text-teal-300">
                          {ledgerIndex}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg text-gray-300">
                          Total Coins (XRP)
                        </span>
                        <span className="text-4xl font-extrabold text-teal-300">
                          {totalCoins}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-4 md:p-6 h-80 relative">
                      {chartData && chartData.labels && chartData.labels.length > 0 ? (
                        <>
                          <Line
                            data={chartData}
                            options={{
                              maintainAspectRatio: false,
                              responsive: true
                            }}
                          />
                          <div className="absolute top-4 right-4 bg-slate-700/80 px-4 py-2 rounded shadow-lg">
                            <span className="text-sm text-white">
                              Current Price: $
                              {currentPrice
                                ? formatNumber(currentPrice, 4)
                                : 'N/A'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          Chart data not available.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-slate-800 p-6 md:p-8 rounded-lg shadow-2xl hover:shadow-teal-500/30 transition-shadow">
                    <h3 className="text-2xl font-bold text-teal-300 mb-4">Trading Pairs (Placeholder)</h3>
                    <p className="text-gray-400 mb-4">
                      Below is a dummy list of trading pairs for demonstration purposes only:
                    </p>
                    <div className="overflow-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-700 text-gray-200 uppercase text-sm">
                            <th className="px-4 py-3 border-b border-gray-600">Pair</th>
                            <th className="px-4 py-3 border-b border-gray-600">Last Price</th>
                            <th className="px-4 py-3 border-b border-gray-600">Volume (24h)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dummyPairs.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-700 transition-colors">
                              <td className="px-4 py-2 border-b border-gray-700 text-teal-300 font-semibold">
                                {item.pair}
                              </td>
                              <td className="px-4 py-2 border-b border-gray-700">
                                ${item.lastPrice}
                              </td>
                              <td className="px-4 py-2 border-b border-gray-700 text-gray-200">
                                {item.volume}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                {/* -------------------- AUTO TRADING SECTION -------------------- */}
                <section id="autotrading">
                  <h2 className="text-3xl font-bold mb-6">Auto Trading</h2>
                  <div className="bg-slate-800 p-6 md:p-8 rounded-lg shadow-2xl hover:shadow-teal-500/30 transition-shadow">
                    <p className="text-gray-300 text-xl mb-6">
                      Automate your trading strategy on XRPL Mainnet.
                    </p>
                    <form className="space-y-6" onSubmit={handleAutoSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-lg text-gray-300 mb-2">
                            User ID
                          </label>
                          <input
                            type="text"
                            value={autoForm.userId}
                            onChange={(e) =>
                              setAutoForm({ ...autoForm, userId: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-lg text-gray-300 mb-2">
                            Amount (XRP)
                          </label>
                          <input
                            type="number"
                            value={autoForm.amount}
                            onChange={(e) =>
                              setAutoForm({ ...autoForm, amount: e.target.value })
                            }
                            placeholder="e.g. 100"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-lg text-gray-300 mb-2">
                            Strategy
                          </label>
                          <select
                            value={autoForm.strategy}
                            onChange={(e) =>
                              setAutoForm({ ...autoForm, strategy: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="Scalping">Scalping</option>
                            <option value="Trend Following">Trend Following</option>
                            <option value="Grid Trading">Grid Trading</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-lg text-gray-300 mb-2">
                            Secret (Seed)
                          </label>
                          <input
                            type="text"
                            value={autoForm.secret}
                            onChange={(e) =>
                              setAutoForm({ ...autoForm, secret: e.target.value })
                            }
                            placeholder="snXXXXXXXXXXXX"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-lg text-gray-300 mb-2">
                          Destination Address
                        </label>
                        <input
                          type="text"
                          value={autoForm.destination}
                          onChange={(e) =>
                            setAutoForm({ ...autoForm, destination: e.target.value })
                          }
                          placeholder="rXXXXXXXXXXXXXXXXX"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-teal-500 hover:bg-teal-400 transition-colors px-6 py-3 rounded font-bold text-gray-900"
                      >
                        Start Auto Trading
                      </button>
                      {autoMsg && (
                        <p className="text-lg mt-4 text-gray-300">{autoMsg}</p>
                      )}
                    </form>
                  </div>
                </section>

                {/* -------------------- COPY TRADING SECTION -------------------- */}
                <section id="copytrading">
                  <h2 className="text-3xl font-bold mb-6">Copy Trading</h2>
                  <div className="bg-slate-800 p-6 md:p-8 rounded-lg shadow-2xl hover:shadow-teal-500/30 transition-shadow">
                    <p className="text-gray-300 text-xl mb-6">
                      Follow an experienced trader and copy their trades on XRPL Mainnet.
                    </p>
                    <form className="space-y-6" onSubmit={handleCopySubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-lg text-gray-300 mb-2">
                            User ID
                          </label>
                          <input
                            type="text"
                            value={copyForm.userId}
                            onChange={(e) =>
                              setCopyForm({ ...copyForm, userId: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-lg text-gray-300 mb-2">
                            Leader Address
                          </label>
                          <input
                            type="text"
                            value={copyForm.leaderAddress}
                            onChange={(e) =>
                              setCopyForm({ ...copyForm, leaderAddress: e.target.value })
                            }
                            placeholder="rLeaderAddress..."
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-lg text-gray-300 mb-2">
                            Copy Percentage (%)
                          </label>
                          <input
                            type="number"
                            value={copyForm.copyPercentage}
                            onChange={(e) =>
                              setCopyForm({ ...copyForm, copyPercentage: e.target.value })
                            }
                            placeholder="e.g. 50"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-lg text-gray-300 mb-2">
                            Secret (Seed)
                          </label>
                          <input
                            type="text"
                            value={copyForm.secret}
                            onChange={(e) =>
                              setCopyForm({ ...copyForm, secret: e.target.value })
                            }
                            placeholder="snXXXXXXXXXXXX"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-lg text-gray-300 mb-2">
                          Copy Destination Address
                        </label>
                        <input
                          type="text"
                          value={copyForm.copyDestination}
                          onChange={(e) =>
                            setCopyForm({ ...copyForm, copyDestination: e.target.value })
                          }
                          placeholder="(Ignored now - Leader's address is used)"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          disabled
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-teal-500 hover:bg-teal-400 transition-colors px-6 py-3 rounded font-bold text-gray-900"
                      >
                        Start Copy Trading
                      </button>
                      {copyMsg && (
                        <p className="text-lg mt-4 text-gray-300">{copyMsg}</p>
                      )}
                    </form>
                  </div>
                </section>

                {/* ------------------ LATEST TRANSACTIONS SECTION --------------- */}
                <section id="latest-transactions">
                  <h2 className="text-3xl font-bold mb-6">Latest Transactions (XRPL)</h2>
                  <div className="bg-slate-800 p-6 md:p-8 rounded-lg shadow-2xl hover:shadow-teal-500/30 transition-shadow">
                    {txList.length === 0 ? (
                      <p className="text-lg text-gray-400">
                        No transactions found in this ledger
                      </p>
                    ) : (
                      <ul className="max-h-56 overflow-auto space-y-4">
                        {txList.map((tx, idx) => {
                          const hash = tx?.tx_json?.hash || tx?.hash || "N/A"
                          const type = tx?.tx_json?.TransactionType || "UnknownTx"
                          return (
                            <li
                              key={idx}
                              className="bg-gray-700 p-4 rounded border border-gray-600 hover:border-teal-500 transition"
                            >
                              <strong className="text-teal-300">Tx:</strong> {hash.slice(0, 12)}... |{" "}
                              <span className="text-green-400">{type}</span>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </section>

                {/* -------------------- RAW LEDGER DATA SECTION ----------------- */}
                <section id="rawdata">
                  <h2 className="text-3xl font-bold mb-6">Raw Ledger Data</h2>
                  <RawDataCollapsible
                    title="Raw Ledger JSON"
                    data={ledgerData}
                  />
                </section>
              </>
            )}
          </div>
        </main>

        {/* ----------------------------- FOOTER ------------------------------- */}
        <footer className="bg-slate-800/90 text-gray-400 text-center text-sm py-4">
          © 2025 XQNode - XRPL AUTO TRADE — All Rights Reserved
        </footer>
      </div>
    </>
  )
}
