# No-Loss Auction Protocol

A decentralized no-loss auction built on [Stellar](https://stellar.org) using [Soroban](https://soroban.stellar.org) smart contracts.

**No-loss** means every outbid participant is refunded instantly and automatically. Nobody loses their tokens except the winner, whose bid goes to the seller.

---

## Contract

| Property | Value |
|---|---|
| **Network** | Stellar Testnet |
| **Contract ID** | `CBUBJIIAYFI62MZ6Y272IPEWBDHPLXAAG6YX7SJREA7XLZZLTZ4KKZJF` |
| **Token** | Native XLM (`CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`) |
| **Explorer** | [stellar.expert](https://stellar.expert/explorer/testnet/contract/CBUBJIIAYFI62MZ6Y272IPEWBDHPLXAAG6YX7SJREA7XLZZLTZ4KKZJF) |

---

## How It Works

1. **Seller** calls `initialize` to create the auction with a SEP-41 token, minimum bid, and duration.
2. **Bidders** call `place_bid` and their tokens are locked in the contract. If they are outbid, their tokens are returned to their wallet automatically in the same transaction.
3. After the deadline, anyone can call `finalize` to send the winning bid to the seller.
4. The seller can `cancel` the auction only if no bids have been placed.

---

## Contract Functions

| Function | Description |
|---|---|
| `initialize(seller, token, min_bid, duration)` | Create auction. Called once by the seller. |
| `place_bid(bidder, amount)` | Lock a bid. Previous highest bidder is refunded automatically. |
| `finalize()` | After deadline: transfer winning bid to seller. |
| `cancel()` | Seller cancels only if zero bids exist. |
| `get_auction()` | Read current auction state. |
| `has_auction()` | Returns `true` if an auction has been initialized. |

---

## Project Structure

```
.
├── contracts/
│   └── no-loss-auction-system/
│       ├── src/
│       │   ├── lib.rs       # Smart contract
│       │   └── test.rs      # 14 unit tests
│       └── Cargo.toml
├── frontend/                # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── config.ts        # Contract ID, RPC, network config
│   │   ├── lib/
│   │   │   ├── soroban.ts   # Contract interactions
│   │   │   └── freighter.ts # Wallet integration
│   │   └── components/
│   │       ├── WalletConnect.tsx
│   │       ├── AuctionInfo.tsx
│   │       ├── PlaceBid.tsx
│   │       ├── CreateAuction.tsx
│   │       └── AuctionActions.tsx
│   └── package.json
├── Cargo.toml
└── README.md
```

---

## Prerequisites

Install these before cloning:

- **Rust**: [rustup.rs](https://rustup.rs)
- **wasm32v1-none target**: `rustup target add wasm32v1-none`
- **Stellar CLI v26+**: [installation guide](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli)
- **Node.js 18+**: [nodejs.org](https://nodejs.org)
- **Freighter wallet**: [freighter.app](https://www.freighter.app) browser extension, set to **Testnet**

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/johneliud/no-loss-auction-system.git
cd no-loss-auction-system
```

### 2. Build and test the contract

```bash
# Build the WASM
stellar contract build

# Run the test suite (14 tests)
cargo test
```

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), connect Freighter (Testnet), and interact with the live auction.

---

## Deploying Your Own Contract

If you want to deploy a fresh instance instead of using the contract above:

### Step 1 - Add a funded testnet account

```bash
# Generate a new key
stellar keys generate --global my-key --network testnet

# Fund it via Friendbot
stellar keys fund my-key --network testnet
```

### Step 2 - Deploy the contract

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/no_loss_auction.wasm \
  --network testnet \
  --source my-key
# Outputs: CONTRACT_ID
```

### Step 3 - Get the native XLM token address

```bash
stellar contract id asset --asset native --network testnet
# Outputs: TOKEN_ADDRESS
```

### Step 4 - Initialize the auction

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source my-key \
  -- initialize \
  --seller $(stellar keys address my-key) \
  --token <TOKEN_ADDRESS> \
  --min_bid 10000000 \       # 1 XLM = 10,000,000 stroops
  --duration 604800           # 7 days in seconds
```

### Step 5 - Update the frontend config

Edit `frontend/src/config.ts` and replace `CONTRACT_ID` with your new contract address.
