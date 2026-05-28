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



mod test;
