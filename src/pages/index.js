// pages/index.js
import React, { useState } from 'react'
import Head from 'next/head'

export default function LandingPage() {
  const [showModal, setShowModal] = useState(false)

  const handleEnterApp = () => {
    setShowModal(true)
  }

  const handleConfirm = () => {
    setShowModal(false)
    window.location.href = '/app'
  }

  const handleCancel = () => {
    setShowModal(false)
  }

  return (
    <>
      <Head>
        <title>XQNode Autotrade & Copytrade</title>
        <meta
          name="description"
          content="Next-level XRPL Autotrade & Copytrade platform. Innovative, secure, and community-driven."
        />
      </Head>

      {/* Container utama */}
      <div className="min-h-screen flex flex-col bg-slate-900 text-white relative">
        
        {/* HEADER */}
        <header className="w-full bg-slate-800/90 px-6 py-4 md:px-12 md:py-6 shadow-xl z-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* BRAND */}
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold text-pink-400 drop-shadow-lg tracking-wide uppercase 
                             hover:scale-105 transition-transform duration-300 
                             neon-border neon-border-pink">
                XQNode Autotrade
              </h1>
              <p className="mt-1 text-sm md:text-base text-gray-300">
                The Future of XRPL Autotrade &amp; Copytrade
              </p>
            </div>

            {/* NAV / BUTTONS */}
            <div className="flex flex-col md:flex-row items-center gap-4 mt-2 md:mt-0">
              <a
                href="https://github.com/XQNode-dev/XQNODE-XRPL-AUTO-TRADE"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-teal-600 hover:bg-teal-500 text-sm md:text-base font-semibold text-white px-4 py-2 rounded-full shadow-lg 
                           transition-transform hover:scale-105 hover:shadow-teal-500/50
                           focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                View on GitHub
              </a>
              <button
                onClick={handleEnterApp}
                className="bg-pink-600 hover:bg-pink-500 text-sm md:text-base font-semibold text-white px-4 py-2 rounded-full shadow-lg
                           transition-transform hover:scale-105 hover:shadow-pink-500/50
                           focus:outline-none focus:ring-2 focus:ring-pink-400"
              >
                Enter App
              </button>
            </div>
          </div>
        </header>

        {/* HERO / MAIN CONTENT */}
        <main className="flex-1 flex flex-col justify-center items-center px-6 md:px-12 py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/dark-neon-bg.jpg')] bg-cover bg-center opacity-20 pointer-events-none" />
          
          <div className="relative z-10 max-w-4xl p-8 md:p-12 rounded-xl bg-slate-800/80 shadow-2xl text-center 
                          animate-fadeIn border border-slate-700/50 
                          neon-shadow transition-all duration-300">
            <h2 className="text-3xl md:text-5xl font-extrabold text-teal-300 drop-shadow-lg mb-4 animate-pulseSlow">
              Welcome to XQNode Autotrade
            </h2>
            <p className="text-gray-300 text-base md:text-lg mb-6">
              Harness the potential of XRPL for ultra-fast, low-fee trading. Our Autotrade &amp; Copytrade platform empowers you to automate strategies and follow top traders, 
              all in a sleek and secure environment.
            </p>
            <p className="text-gray-400 text-sm md:text-base mb-8">
              Currently in <span className="text-pink-300 font-semibold">early development</span>. Please do not use real-world or sensitive information here. 
              We’re evolving rapidly, and appreciate your help in testing.
            </p>

            {/* PROPOSAL / INFO BOX */}
            <div className="bg-slate-900/50 p-6 md:p-8 rounded-lg border border-pink-500 text-left space-y-3 hover:shadow-lg hover:shadow-pink-500/20 transition-shadow">
              <h3 className="text-2xl font-bold text-pink-300 mb-2">
                Project Proposal
              </h3>
              <ul className="list-disc list-inside text-gray-100 text-sm md:text-base space-y-2">
                <li>
                  <span className="text-teal-400 font-semibold">Automated Trading:</span> 
                  Real-time XRPL data feeds your custom strategies.
                </li>
                <li>
                  <span className="text-teal-400 font-semibold">Copy Trading:</span> 
                  Mirror expert traders with a single click.
                </li>
                <li>
                  <span className="text-teal-400 font-semibold">XRPL Efficiency:</span> 
                  Near-instant settlement and tiny fees.
                </li>
                <li>
                  <span className="text-teal-400 font-semibold">Open Source:</span> 
                  Shape the future on GitHub.
                </li>
              </ul>
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="bg-slate-800/90 text-gray-400 text-center text-xs md:text-sm py-4">
          © 2025 XQNode Autotrade — All Rights Reserved
        </footer>

        {/* MODAL POPUP */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-slate-800 border border-pink-500 p-6 md:p-8 rounded-xl shadow-2xl max-w-lg w-11/12 md:w-auto 
                            animate-fadeIn">
              <h3 className="text-xl md:text-2xl font-bold text-pink-300 mb-4 text-center">
                Development Notice
              </h3>
              <p className="text-gray-300 text-sm md:text-base mb-6">
                This platform is still under development. Please refrain from submitting any real credentials or sensitive information. 
                All functionalities are experimental and subject to change.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded font-bold hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-pink-600 text-white rounded font-bold hover:bg-pink-500 transition-colors"
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
