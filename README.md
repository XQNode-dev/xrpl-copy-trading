# XQNode XRPLQuantum Node: Autotrade & Copytrade

Welcome to the **XQNode XRPLQuantum Node** project! This repository hosts the code for our next-generation decentralized trading platform on the XRP Ledger (XRPL). Our platform features **automated trading (Autotrade)** and **social copy trading (Copytrade)**, designed to empower traders of all levels with fast, transparent, and efficient trading on XRPL.

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Installation](#installation)
4. [Usage](#usage)
5. [API Endpoints](#api-endpoints)
6. [Contribution](#contribution)
7. [Roadmap](#roadmap)
8. [License](#license)

---

## Overview

**XQNode XRPLQuantum Node** aims to revolutionize decentralized trading by combining:

- **Autotrade**: Automate your trading strategies on the XRPL Mainnet.  
- **Copytrade**: Follow and mirror trades from experienced professionals.  
- **Real-Time Notifications**: Stay updated with instant notifications via Socket.IO.  
- **Futuristic UI**: Enjoy a modern, responsive, and visually appealing interface built with Next.js and Tailwind CSS.

Our platform leverages XRPL’s near-instant settlement and minimal transaction fees, giving users an edge in the fast-paced world of decentralized finance (DeFi).

---

## Features

- **Automated Trading (Autotrade)**  
  - Deploy algorithmic trading strategies (e.g., Scalping, Trend Following, Grid Trading).  
  - Execute trades automatically on XRPL Mainnet, 24/7.

- **Social Copy Trading (Copytrade)**  
  - Mirror trades of top traders seamlessly.  
  - Customize copy percentage to manage your risk exposure.

- **Real-Time Data & Notifications**  
  - Live updates from XRPL using Socket.IO.  
  - Interactive dashboards with real-time price charts sourced from Binance.

- **Futuristic & Responsive UI**  
  - Modern, eye-catching design with smooth animations.  
  - Fully responsive layout for optimal viewing on all devices.

- **Open-Source and Community-Driven**  
  - Fully open-source project; community contributions and feedback are welcome.  
  - Transparent operations, with all transactions recorded on the XRPL and stored in a PostgreSQL database.

---

## Installation

### Prerequisites

- **Node.js** (v14.x or higher)  
- **npm** (v6.x or higher)  
- **PostgreSQL** (v10 or higher)  
- **Next.js** (for the UI)  
- **Tailwind CSS** configured in your Next.js project

### Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/xqnode-xrplquantum-node.git
   cd xqnode-xrplquantum-node
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure the Database**  
   - Create a PostgreSQL database (e.g., `xrpl_trading`).  
   - Set your database connection string in an environment variable or update `db.js` directly.

   Example using `.env`:
   ```bash
   DATABASE_URL=postgres://username:password@localhost:5432/xrpl_trading
   ```

4. **Run Database Migrations**  
   - Execute the SQL file in `migrations/init.sql` (using `psql`, `pgAdmin`, or another tool) to create the required tables.

5. **Start the Application**  
   - **Development mode**:
     ```bash
     npm run dev
     ```
   - **Production mode**:
     ```bash
     npm run build
     npm run start
     ```

6. **Access the Application**  
   - Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

---

## Usage

1. **Connect Wallet**  
   - Click the **Connect Wallet** button to link your XRPL wallet by providing your seed.  
   - Your wallet address and balance will be displayed in the header.

2. **Dashboard & Price Chart**  
   - View real-time XRPL ledger data.  
   - Check the **XRP/USDT** price charts sourced from Binance, including current price info.

3. **Autotrade & Copytrade**  
   - Use the provided forms to start **automated trading** or **copy trading** strategies on the XRPL Mainnet.  
   - Notifications for your trading activities will appear in real time.

---

## API Endpoints

### `GET /api/transactions`
Retrieves ledger data from XRPL Mainnet.

### `GET /api/wallet?address=<XRPL_ADDRESS>`
Fetches account information for the provided XRPL address.

### `POST /api/autotrading/start`
Starts an automated trading strategy.

**Request Body:**
```json
{
  "userId": "user1",
  "amount": "100",
  "strategy": "Scalping",
  "secret": "snXXXXXXXXXXXX",
  "destination": "rXXXXXXXXXXXXXXXXX"
}
```

### `POST /api/copytrading/start`
Initiates a copy trading strategy.

**Request Body:**
```json
{
  "userId": "user2",
  "leaderAddress": "rLeaderAddress...",
  "copyPercentage": "50",
  "secret": "snXXXXXXXXXXXX",
  "copyDestination": "rXXXXXXXXXXXXXXXXX"
}
```

---

## Contribution

We welcome contributions from the community! To contribute:

1. **Fork** this repository.  
2. **Create a new branch** for your feature or bug fix.  
3. **Submit a pull request** with a detailed description of your changes.  
4. Join our community discussions via [GitHub Issues](../../issues) or our forums.

---

## Roadmap

Our target release for these features is **1–2 months** from now. Key milestones:

- **Beta Release**  
  - Launch core Autotrade and Copytrade features.  
  - Deploy real-time dashboards and interactive charts.

- **Full Production Release**  
  - Enhance UI/UX and add additional security measures.  
  - Introduce community-driven features like leaderboards and advanced trading options.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

Thank you for your interest in **XQNode XRPLQuantum Node**! For questions or feedback, please feel free to create an issue or open a pull request.
