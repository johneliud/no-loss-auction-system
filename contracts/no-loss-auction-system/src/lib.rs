#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Symbol};

// LIFETIME_THRESHOLD: 2 days
// LIFETIME_BUMP: 6 days
const LIFETIME_THRESHOLD: u32 = 34_560;
const LIFETIME_BUMP: u32 = 103_680;

#[contracttype]
#[derive(Clone)]
pub struct AuctionState {
    pub seller: Address,
    pub token: Address,
    pub min_bid: i128,
    pub deadline: u64,
    pub highest_bidder: Option<Address>,
    pub highest_bid: i128,
    pub finalized: bool,
    pub cancelled: bool,
}

#[contracttype]
pub enum DataKey {
    Auction,
}

fn emit(env: &Env, topic: &str, data: impl soroban_sdk::IntoVal<Env, soroban_sdk::Val>) {
    env.events()
        .publish((Symbol::new(env, topic),), data);
}

#[contract]
pub struct NoLossAuction;

#[contractimpl]
impl NoLossAuction {
    /// Create a new auction which can only be called once per contract instance.
    pub fn initialize(
        env: Env,
        seller: Address,
        token: Address,
        min_bid: i128,
        duration: u64,
    ) {
        seller.require_auth();

        if env.storage().instance().has(&DataKey::Auction) {
            panic!("already initialized")
        }
        if min_bid <= 0 {
            panic!("min bid must be positive")
        }
        if duration == 0 {
            panic!("duration must be positive")
        }

        let deadline = env.ledger().timestamp() + duration;

        env.storage().instance().set(
            &DataKey::Auction,
            &AuctionState {
                seller: seller.clone(),
                token,
                min_bid,
                deadline,
                highest_bidder: None,
                highest_bid: 0,
                finalized: false,
                cancelled: false,
            },
        );

        env.storage()
            .instance()
            .extend_ttl(LIFETIME_THRESHOLD, LIFETIME_BUMP);

        emit(&env, "auction_created", deadline);
    }

    /// Place a bid. The previous highest bidder is refunded immediately (no-loss).
    pub fn place_bid(env: Env, bidder: Address, amount: i128) {
        bidder.require_auth();

        let mut auction: AuctionState = env
            .storage()
            .instance()
            .get(&DataKey::Auction)
            .expect("not initialized");

        if auction.finalized {
            panic!("auction already finalized")
        }
        if auction.cancelled {
            panic!("auction is cancelled")
        }
        if env.ledger().timestamp() >= auction.deadline {
            panic!("auction has ended")
        }
        if amount < auction.min_bid {
            panic!("bid below minimum")
        }
        if auction.highest_bidder.is_some() && amount <= auction.highest_bid {
            panic!("must exceed current highest bid")
        }

        let tok = token::Client::new(&env, &auction.token);

        // Lock new bid in the contract
        tok.transfer(&bidder, &env.current_contract_address(), &amount);

        // Automatically refund the previous highest bidder (no-loss guarantee)
        if let Some(ref prev) = auction.highest_bidder.clone() {
            tok.transfer(
                &env.current_contract_address(),
                prev,
                &auction.highest_bid,
            );
            emit(&env, "bid_refunded", auction.highest_bid);
        }

        emit(&env, "bid_placed", amount);

        auction.highest_bidder = Some(bidder);
        auction.highest_bid = amount;

        env.storage().instance().set(&DataKey::Auction, &auction);
        env.storage()
            .instance()
            .extend_ttl(LIFETIME_THRESHOLD, LIFETIME_BUMP);
    }

    /// Finalize the auction after the deadline. Winning bid is transferred to the seller.
    pub fn finalize(env: Env) {
        let mut auction: AuctionState = env
            .storage()
            .instance()
            .get(&DataKey::Auction)
            .expect("not initialized");

        if auction.finalized {
            panic!("already finalized")
        }
        if auction.cancelled {
            panic!("auction is cancelled")
        }
        if env.ledger().timestamp() < auction.deadline {
            panic!("auction not yet ended")
        }

        if let Some(ref _winner) = auction.highest_bidder.clone() {
            let tok = token::Client::new(&env, &auction.token);
            tok.transfer(
                &env.current_contract_address(),
                &auction.seller,
                &auction.highest_bid,
            );
            emit(&env, "auction_finalized", auction.highest_bid);
        }

        auction.finalized = true;
        env.storage().instance().set(&DataKey::Auction, &auction);
        env.storage()
            .instance()
            .extend_ttl(LIFETIME_THRESHOLD, LIFETIME_BUMP);
    }

    
}

mod test;
