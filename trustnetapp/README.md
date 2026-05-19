# 💻 TrustNet — Frontend Web Application

> This directory contains the **Next.js 14** web application for **TrustNet**, a decentralized crowd-sourced fact-checking platform.
> For the master documentation, project showcase screenshots, smart contract specifications, and the research thesis, please refer to the **[Main Project README](../README.md)**.

---

## ⚡ Key Application Features

- 🔑 **Web3 Connection**: Integrated Connect Wallet button using **thirdweb v5 SDK** (supporting MetaMask, Coinbase, and other major wallets).
- 🧭 **Guided Tour**: Dynamic tutorial interface using `react-joyride` to onboard new users step-by-step.
- 🧠 **Recommendation Engine**: Personalized user preference detection that highlights claims to verify based on interaction history.
- 🚰 **Sepolia Faucet Widget**: Directly embedded widget to access Sepolia testnet resources.
- 📊 **Interactive Charts**: Custom data visualizations for voting status using Chart.js.
- 🔍 **Filter & Search**: Interactive scrollable category filter and real-time live search.

---

## 🚀 Quick Start

### 1. Configure Environment Variables
Create a `.env.local` file in this directory and populate it with your thirdweb client credentials:

```env
NEXT_PUBLIC_TEMPLATE_CLIENT_ID=your_thirdweb_client_id_here
```

*(Create a free account and get your client ID at [thirdweb.com/dashboard](https://thirdweb.com/dashboard))*

### 2. Install Dependencies
Using your preferred package manager:

```bash
npm install
# or
yarn install
```

### 3. Run Development Server
Start the local server with standard Next.js compilation or with Turbopack for lightning-fast speeds:

```bash
# Standard
npm run dev

# Turbopack (Recommended)
npm run dev:turbo
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the application.

---

## 📦 Directory Structure

```text
trustnetapp/
├── public/                 # Static assets and icons
└── src/
    └── app/
        ├── client.ts       # thirdweb client configuration
        ├── page.tsx        # Dashboard page & recommendation feed
        ├── layout.tsx      # Core viewport, HTML layout, and metadata
        ├── components/     # Custom UI widgets (faucet, charts, tutorials, navbar)
        └── constants/      # Contract address constants and ABIs
```

---

## 🔗 Related Resources

- **[Master README](../README.md)**
- **[Decentralized (thesis).pdf](../Decentralized%20(thesis).pdf)**
- **[Smart Contracts Codebase](../trustnetcontract)**
