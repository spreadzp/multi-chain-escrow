# Paul Karpus

**Senior Full Stack Blockchain Developer**

📧 spread2009@gmail.com | 💼 [LinkedIn](https://www.linkedin.com/in/paul-spread-bb337b63/) | 🐙 [GitHub](https://github.com/spreadzp) | 📱 Telegram: @paulspread

---

## Professional Summary

Full Stack Developer with **14+ years** in software development, **5+ years as Senior**. Strong on both ends: **React + TypeScript** frontend and **Node.js/NestJS** backend. Commercial blockchain experience across **EVM** (Solidity, ethers.js, viem, LayerZero bridges, Polygon, BSC) and **non-EVM** chains — **Solana** (Rust/Anchor, SPL tokens, DeFi bots) and **Stellar** (Stellar SDK, Soroban smart contracts, SAC tokens). Built cryptocurrency exchanges, cross-chain bridges, custodial wallets, and payment systems handling 10K+ daily transactions. Experienced in **end-to-end feature ownership** — from smart contract design to frontend deployment, often working solo across the full stack. Uses **AI-assisted development tools** (Windsurf, Claude Code, Gemini) across the entire workflow: architecture, design, task planning, slice-based development, testing, and DevOps. Recently completed a **multi-chain escrow dApp** on Solana + Stellar — public GitHub repo ([github.com/spreadzp/multi-chain-escrow](https://github.com/spreadzp/multi-chain-escrow)), Vercel-hosted frontend ([fe-olive-nine.vercel.app](https://fe-olive-nine.vercel.app)), interactive ReactFlow diagrams, and EVM developer onboarding pages.

---

## Core Skills

| Category | Technologies |
|---|---|
| **Frontend** | React, Next.js, TypeScript, Zustand, Redux Toolkit, Tailwind CSS, Angular, Vue.js |
| **Backend** | Node.js, NestJS, Express, Hono, PHP/Laravel, Prisma, PostgreSQL, MySQL, MongoDB, Redis |
| **Auth** | JWT, OAuth2, Web3 wallet-based auth, role-based access control |
| **Blockchain — Solana** | Rust, Anchor framework, SPL Token, Phantom wallet, PDA accounts, CPI, Solana CLI/test-validator |
| **Blockchain — Stellar** | Stellar SDK (Node.js, pre-Soroban), Soroban SDK (Rust, current project), SAC/SEP-41 tokens, Freighter wallet, contract storage |
| **Blockchain — EVM** | Solidity, ethers.js, viem, LayerZero bridges, Polygon, BSC, Harmony, Hardhat |
| **Blockchain — Other** | Bitcoin/Litecoin RPC, Tron, Hedera, Cosmos SDK, NEM |
| **Infrastructure** | Docker, Docker Compose, CI/CD (GitLab CI, GitHub Actions), VPS deployment, Kafka, BullMQ, RabbitMQ |
| **AI Tools** | Windsurf (Claude Code, Gemini), AI-assisted architecture, design, task planning, testing, DevOps |
| **Testing** | Jest, Vitest, Playwright, unit/E2E/contract tests, TDD |

---

## Blockchain Experience (Solana & Stellar)

### Multi-Chain Escrow dApp — Solana + Stellar *(Portfolio Project, 2026)*
**Full Stack Developer** | GitHub: [multi-chain-escrow](https://github.com/spreadzp/multi-chain-escrow) | Live demo: [fe-olive-nine.vercel.app](https://fe-olive-nine.vercel.app)

Production-grade escrow application supporting both Solana and Stellar networks with a unified React frontend. Deployed on public testnets with Vercel-hosted UI. Includes interactive ReactFlow architecture diagrams and onboarding pages for EVM developers learning Solana and Stellar. Designed to demonstrate end-to-end full-stack Web3 capabilities across two non-EVM chains.

- **Solana:** Anchor program with PDA-based escrow state, SPL token CPI for deposits, role-based release/refund instructions, on-chain events
- **Stellar:** Soroban smart contract with persistent storage, SAC token transfers, `require_auth` for role verification, contract events
- **Frontend:** Next.js + React + TypeScript, Zustand state management, Phantom (Solana) and Freighter (Stellar) wallet integration, interactive ReactFlow diagrams (zoom/pan/minimap), onboarding pages comparing EVM vs Solana/Stellar concepts
- **Architecture:** Adapter pattern — single `EscrowAdapter` interface with network-specific implementations; UI is chain-agnostic
- **Deployment:** Contracts on Solana devnet + Stellar testnet, frontend on Vercel; local validator workflow for development
**Tech:** TypeScript, React, Next.js, Rust, Anchor, Soroban SDK, SPL Token, SAC, Phantom, Freighter, Zustand, ReactFlow (@xyflow/react)
**Tech:** TypeScript, React, Next.js, Rust, Anchor, Soroban SDK, SPL Token, SAC, Phantom, Freighter, Zustand

### Solana DeFi Trading Bots
**Blockchain Developer** | 2023–2024

- Built automated **delta-neutral trading bots** using **Solana Web3.js** and **Rust/Anchor** programs interacting with major Solana DeFi protocols
- Implemented on-chain program logic with PDA accounts, SPL token operations, and CPI calls
- Integrated with Solana RPC for real-time price monitoring and trade execution

### Cross-Chain Bridge — Solana ↔ EVM
**Blockchain Developer** | 2022–2023

- Developed **LayerZero-based bridges** between Solana and custom EVM chains
- Wrote and audited smart contracts for cross-chain asset transfers
- Handled Solana program-to-EVM message passing and token locking/unlocking logic

### Stellar SDK — Supply Chain Tracking
**Full Stack Developer** | 2018–2019

- Integrated **Stellar SDK** (Node.js) for blockchain-based supply chain tracking with IoT sensors
- Used Stellar network for payment operations and transaction submission (pre-Soroban era — no smart contracts)
- Combined Stellar payments with Arduino/IoT data feeds for real-world asset tracking
- Later studied **Soroban** smart contracts (2025); current portfolio project (above) demonstrates full Soroban competence

**Tech:** Node.js, Stellar SDK, Arduino, IoT, MongoDB

---

## Professional Experience

### Senior Full Stack & Blockchain Developer
**WayToPay** | November 2020 – Present

Cryptocurrency exchange platform with multi-chain wallet infrastructure and self-hosted blockchain nodes.

- Built **NestJS backend** for cryptocurrency exchange supporting BTC, LTC, ETH, TRX wallets with Prisma ORM, PostgreSQL, Redis, and BullMQ job queues
- Deployed and maintained **self-hosted blockchain nodes** (Litecoin, Tron) on VPS with Docker — full node infrastructure, RPC management, block event processing
- Implemented **wallet providers** (BTC, ETH, LTC, TRX) with RPC clients, UTXO management, and transaction signing
- Developed **event-driven microservices** for processing deposits, withdrawals, and order events via Kafka and BullMQ
- Built **real-time rates aggregation** pulling data from secondary exchanges via CCXT integration
- Built **React admin dashboard** with TypeScript for exchange operations management
- Implemented **authentication services**: JWT, OAuth2, Web3 wallet-based auth depending on use case
- TDD approach: unit tests (Jest) and E2E tests for critical transaction paths

**Tech:** TypeScript, NestJS, React, Prisma, PostgreSQL, Redis, Kafka, BullMQ, ethers.js, bitcoinjs-lib, tronweb, CCXT, Docker, Jest

### Senior Backend & Blockchain Developer
**YXXY (Valhalla fork)** | November 2020 – July 2024

Multi-service cryptocurrency exchange (fork of Valhalla) with self-hosted nodes and microservices architecture.

- Built **Laravel-based microservices**: wallet_service, crypto_service, spot_trading_service, auth_service, futures_service
- Used **Kafka + Redis** for inter-service communication — each microservice had its own DB; Kafka ensured transactional persistence so deals were never lost across services
- Processed **blockchain confirmation events** through Kafka pipelines — deposits, withdrawals, order matching with reliable delivery guarantees
- Deployed and maintained **self-hosted blockchain nodes** for event processing
- Implemented **custodial wallet system** with hot/cold address management for EVM, BTC, and Tron
- Developed **order matching engine** handling 10K+ daily transactions with high event throughput across microservices
- Integrated **Alchemy API** for BSC, BTC, Tron blockchain monitoring
- Built **React frontends** (admin-frontend + frontend-clean) with TypeScript, Redux Toolkit, WebSocket for real-time orderbook
- Containerized services with Docker Compose (Kafka, Redis, MySQL)

**Tech:** PHP/Laravel, React, TypeScript, Redux Toolkit, Kafka, Redis, MySQL, Docker, WebSocket

### Full-Stack Developer
**Multiple Companies** | 2015 – November 2020

Commercial projects across blockchain, fintech, and Web3:

- Built **decentralized exchanges** on Cosmos SDK with REST/GraphQL APIs
- Developed **arbitrage trading bots** across multiple cryptocurrency exchanges
- Created **supply-chain tracking** with IoT sensors on NEM blockchain + Stellar SDK integration
- Delivered **Web3 solutions** for green energy certificates and sports betting with on-chain settlement
- Built **cross-chain bridges** (Harmony ↔ Edgeware) with Solidity + Rust on Substrate
- Developed healthcare applications on Polygon with NestJS + Angular

**Tech:** Node.js, Express, NestJS, React, Angular, Solidity, Rust, MongoDB, MySQL, Waves (Ride), Stellar SDK

---

## Selected Projects

### AgentGate — AI Agent Identity on Hedera
Backend server for on-chain AI agent identity using Hedera NFT passports, HCS messaging, and MCP server (32 tools). Built with Hono, @hashgraph/sdk, x402 payment protocol.

**Tech:** TypeScript, Hono, Hedera SDK, MCP, x402, IPFS, Zod

### Facilitator — x402 Payment Infrastructure
NestJS backend for x402 payment protocol enabling AI agents to pay for services. Blockchain integration (ethers.js, viem), Prisma ORM, Redis caching, OpenAI/Ollama integration.

**Tech:** NestJS, Prisma, ethers.js, viem, Redis, OpenAI, MCP, Docker

### LP-BOT — Delta-Neutral Liquidity Provider (Solana)
Hono.js server for delta-neutral LP bot with Solana Web3 integration, Prisma/SQLite, Zod validation, WebSocket real-time updates, and Vitest test suites.

**Tech:** Hono, TypeScript, Solana Web3, Prisma, Zod, WebSocket, Vitest

### OTC-Canton — Institutional Dark Pool (Hackathon)
Canton Network-based OTC dark pool with sub-transaction privacy. Daml smart contracts, Next.js 15 frontend with multi-party role dashboards.

**Tech:** Daml, Canton Network, Next.js 15, Storybook, RAG (Ollama)

---

## Education & Certifications

- **Zero-Knowledge Proofs Bootcamp** — Encode Club (Sep 2024 – Nov 2024)
- **Bachelor's Degree in Computer Science** — "Step" Computer Academy (Sep 2012 – Jun 2015, 3.5 years)

---

## Languages

- **Ukrainian** — Native
- **Russian** — Native
- **English** — B1 (Intermediate)

---

## Additional Information

- Available for remote positions worldwide (B2B/Employment)
- Hobbies: Competitive chess, hackathon participation, continuous blockchain & AI research
