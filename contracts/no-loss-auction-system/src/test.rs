#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{Client as TokenClient, StellarAssetClient as TokenAdmin},
    Address, Env,
};

fn setup_token<'a>(env: &'a Env, admin: &Address) -> (Address, TokenClient<'a>, TokenAdmin<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let addr = sac.address();
    (
        addr.clone(),
        TokenClient::new(env, &addr),
        TokenAdmin::new(env, &addr),
    )
}

fn setup_auction(env: &Env) -> (Address, Address, NoLossAuctionClient, TokenClient) {
    let seller = Address::generate(env);
    let (token_addr, token, sac) = setup_token(env, &seller);
    
    // Give the seller a token balance so their account is funded
    sac.mint(&seller, &0_i128);
    let id = env.register(NoLossAuction, ());
    let client = NoLossAuctionClient::new(env, &id);
    client.initialize(&seller, &token_addr, &1_000_i128, &3_600_u64);
    (seller, token_addr, client, token)
}

#[test]
fn test_initialize_stores_state() {
    let env = Env::default();
    env.mock_all_auths();

    let seller = Address::generate(&env);
    let (token_addr, _, _) = setup_token(&env, &seller);
    let id = env.register(NoLossAuction, ());
    let client = NoLossAuctionClient::new(&env, &id);

    client.initialize(&seller, &token_addr, &500_i128, &7_200_u64);

    let a = client.get_auction();
    assert_eq!(a.seller, seller);
    assert_eq!(a.token, token_addr);
    assert_eq!(a.min_bid, 500);
    assert_eq!(a.highest_bid, 0);
    assert!(a.highest_bidder.is_none());
    assert!(!a.finalized);
    assert!(!a.cancelled);
    assert!(client.has_auction());
}

#[test]
#[should_panic]
fn test_double_initialize_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let seller = Address::generate(&env);
    let (token_addr, _, _) = setup_token(&env, &seller);
    let id = env.register(NoLossAuction, ());
    let client = NoLossAuctionClient::new(&env, &id);
    client.initialize(&seller, &token_addr, &100_i128, &3_600_u64);
    client.initialize(&seller, &token_addr, &100_i128, &3_600_u64);
}

#[test]
fn test_first_bid_locks_tokens() {
    let env = Env::default();
    env.mock_all_auths();

    let seller = Address::generate(&env);
    let (token_addr, token, sac) = setup_token(&env, &seller);
    let bidder = Address::generate(&env);
    sac.mint(&bidder, &5_000_i128);

    let id = env.register(NoLossAuction, ());
    let client = NoLossAuctionClient::new(&env, &id);
    client.initialize(&seller, &token_addr, &100_i128, &3_600_u64);

    client.place_bid(&bidder, &2_000_i128);

    let a = client.get_auction();
    assert_eq!(a.highest_bid, 2_000);
    assert_eq!(a.highest_bidder, Some(bidder.clone()));
    assert_eq!(token.balance(&bidder), 3_000);
    assert_eq!(token.balance(&id), 2_000);
}

#[test]
fn test_outbid_refunds_previous_bidder() {
    let env = Env::default();
    env.mock_all_auths();

    let seller = Address::generate(&env);
    let (token_addr, token, sac) = setup_token(&env, &seller);
    let bidder1 = Address::generate(&env);
    let bidder2 = Address::generate(&env);
    sac.mint(&bidder1, &1_000_i128);
    sac.mint(&bidder2, &1_000_i128);

    let id = env.register(NoLossAuction, ());
    let client = NoLossAuctionClient::new(&env, &id);
    client.initialize(&seller, &token_addr, &100_i128, &3_600_u64);

    client.place_bid(&bidder1, &300_i128);
    assert_eq!(token.balance(&bidder1), 700);

    client.place_bid(&bidder2, &500_i128);
    assert_eq!(token.balance(&bidder1), 1_000);
    assert_eq!(token.balance(&bidder2), 500);

    let a = client.get_auction();
    assert_eq!(a.highest_bid, 500);
    assert_eq!(a.highest_bidder, Some(bidder2));
}

#[test]
#[should_panic]
fn test_bid_below_minimum_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let seller = Address::generate(&env);
    let (token_addr, _, sac) = setup_token(&env, &seller);
    let bidder = Address::generate(&env);
    sac.mint(&bidder, &1_000_i128);
    let id = env.register(NoLossAuction, ());
    let client = NoLossAuctionClient::new(&env, &id);
    client.initialize(&seller, &token_addr, &500_i128, &3_600_u64);
    client.place_bid(&bidder, &100_i128);
}

#[test]
#[should_panic]
fn test_bid_must_exceed_highest_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let seller = Address::generate(&env);
    let (token_addr, _, sac) = setup_token(&env, &seller);
    let b1 = Address::generate(&env);
    let b2 = Address::generate(&env);
    sac.mint(&b1, &1_000_i128);
    sac.mint(&b2, &1_000_i128);
    let id = env.register(NoLossAuction, ());
    let client = NoLossAuctionClient::new(&env, &id);
    client.initialize(&seller, &token_addr, &100_i128, &3_600_u64);
    client.place_bid(&b1, &500_i128);
    client.place_bid(&b2, &400_i128);
}

#[test]
#[should_panic]
fn test_bid_after_deadline_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let seller = Address::generate(&env);
    let (token_addr, _, sac) = setup_token(&env, &seller);
    let bidder = Address::generate(&env);
    sac.mint(&bidder, &1_000_i128);
    let id = env.register(NoLossAuction, ());
    let client = NoLossAuctionClient::new(&env, &id);
    client.initialize(&seller, &token_addr, &100_i128, &3_600_u64);
    env.ledger().with_mut(|l| l.timestamp += 3_601);
    client.place_bid(&bidder, &200_i128);
}

#[test]
fn test_finalize_sends_bid_to_seller() {
    let env = Env::default();
    env.mock_all_auths();
    let seller = Address::generate(&env);
    let (token_addr, token, sac) = setup_token(&env, &seller);
    let bidder = Address::generate(&env);
    sac.mint(&bidder, &1_000_i128);

    let id = env.register(NoLossAuction, ());
    let client = NoLossAuctionClient::new(&env, &id);
    client.initialize(&seller, &token_addr, &100_i128, &3_600_u64);
    client.place_bid(&bidder, &400_i128);

    env.ledger().with_mut(|l| l.timestamp += 3_601);
    client.finalize();

    assert!(client.get_auction().finalized);
    assert_eq!(token.balance(&seller), 400);
    assert_eq!(token.balance(&bidder), 600);
}

#[test]
fn test_finalize_with_no_bids_succeeds() {
    let env = Env::default();
    env.mock_all_auths();
    let seller = Address::generate(&env);
    let (token_addr, _, _) = setup_token(&env, &seller);
    let id = env.register(NoLossAuction, ());
    let client = NoLossAuctionClient::new(&env, &id);
    client.initialize(&seller, &token_addr, &100_i128, &3_600_u64);
    env.ledger().with_mut(|l| l.timestamp += 3_601);
    client.finalize();
    assert!(client.get_auction().finalized);
}

#[test]
#[should_panic]
fn test_finalize_before_deadline_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let seller = Address::generate(&env);
    let (token_addr, _, _) = setup_token(&env, &seller);
    let id = env.register(NoLossAuction, ());
    let client = NoLossAuctionClient::new(&env, &id);
    client.initialize(&seller, &token_addr, &100_i128, &3_600_u64);
    client.finalize();
}

#[test]
#[should_panic]
fn test_double_finalize_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let seller = Address::generate(&env);
    let (token_addr, _, _) = setup_token(&env, &seller);
    let id = env.register(NoLossAuction, ());
    let client = NoLossAuctionClient::new(&env, &id);
    client.initialize(&seller, &token_addr, &100_i128, &3_600_u64);
    env.ledger().with_mut(|l| l.timestamp += 3_601);
    client.finalize();
    client.finalize();
}

#[test]
fn test_cancel_with_no_bids_succeeds() {
    let env = Env::default();
    env.mock_all_auths();
    let seller = Address::generate(&env);
    let (token_addr, _, _) = setup_token(&env, &seller);
    let id = env.register(NoLossAuction, ());
    let client = NoLossAuctionClient::new(&env, &id);
    client.initialize(&seller, &token_addr, &100_i128, &3_600_u64);
    client.cancel();
    assert!(client.get_auction().cancelled);
}

#[test]
#[should_panic]
fn test_cancel_with_bids_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let seller = Address::generate(&env);
    let (token_addr, _, sac) = setup_token(&env, &seller);
    let bidder = Address::generate(&env);
    sac.mint(&bidder, &1_000_i128);
    let id = env.register(NoLossAuction, ());
    let client = NoLossAuctionClient::new(&env, &id);
    client.initialize(&seller, &token_addr, &100_i128, &3_600_u64);
    client.place_bid(&bidder, &200_i128);
    client.cancel();
}

#[test]
#[should_panic]
fn test_double_cancel_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let seller = Address::generate(&env);
    let (token_addr, _, _) = setup_token(&env, &seller);
    let id = env.register(NoLossAuction, ());
    let client = NoLossAuctionClient::new(&env, &id);
    client.initialize(&seller, &token_addr, &100_i128, &3_600_u64);
    client.cancel();
    client.cancel();
}
