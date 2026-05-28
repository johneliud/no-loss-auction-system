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

    
}

mod test;
