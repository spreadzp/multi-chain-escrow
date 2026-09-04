#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Events as _},
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env,
};

use escrow::{EscrowData, EscrowStatus};

fn setup_token(env: &Env, admin: &Address) -> Address {
    env.register_stellar_asset_contract_v2(admin.clone())
        .address()
}

fn mint_token(env: &Env, token: &Address, to: &Address, amount: i128) {
    StellarAssetClient::new(env, token).mint(to, &amount);
}

#[test]
fn test_create_escrow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);

    let amount: i128 = 1_000_000;
    mint_token(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let client = escrow::EscrowClient::new(&env, &contract_id);

    let nonce = client.create_escrow(
        &depositor,
        &beneficiary,
        &resolver,
        &token,
        &amount,
    );

    assert_eq!(nonce, 0);

    env.as_contract(&contract_id, || {
        let key = escrow::DataKey::Escrow(0);
        let data: EscrowData = env.storage().persistent().get(&key).unwrap();

        assert_eq!(data.depositor, depositor);
        assert_eq!(data.beneficiary, beneficiary);
        assert_eq!(data.resolver, resolver);
        assert_eq!(data.token, token);
        assert_eq!(data.amount, amount);
        assert_eq!(data.status, EscrowStatus::Created);
        assert_eq!(data.nonce, 0);

        let counter: u64 = env.storage().persistent().get(&escrow::DataKey::Counter).unwrap();
        assert_eq!(counter, 1);
    });

    let token_client = TokenClient::new(&env, &token);
    assert_eq!(token_client.balance(&depositor), 0);
    assert_eq!(token_client.balance(&contract_id), amount);
}

#[test]
fn test_release_escrow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);

    let amount: i128 = 1_000_000;
    mint_token(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let client = escrow::EscrowClient::new(&env, &contract_id);

    let nonce = client.create_escrow(&depositor, &beneficiary, &resolver, &token, &amount);
    assert_eq!(nonce, 0);

    client.release_escrow(&beneficiary, &nonce);

    env.as_contract(&contract_id, || {
        let data: EscrowData = env.storage().persistent().get(&escrow::DataKey::Escrow(0)).unwrap();
        assert_eq!(data.status, EscrowStatus::Released);
    });

    let token_client = TokenClient::new(&env, &token);
    assert_eq!(token_client.balance(&contract_id), 0);
    assert_eq!(token_client.balance(&beneficiary), amount);
}

#[test]
fn test_release_escrow_by_resolver() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);

    let amount: i128 = 500_000;
    mint_token(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let client = escrow::EscrowClient::new(&env, &contract_id);

    let nonce = client.create_escrow(&depositor, &beneficiary, &resolver, &token, &amount);

    client.release_escrow(&resolver, &nonce);

    let token_client = TokenClient::new(&env, &token);
    assert_eq!(token_client.balance(&beneficiary), amount);
}

#[test]
#[should_panic(expected = "caller must be beneficiary or resolver")]
fn test_release_escrow_unauthorized() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);
    let attacker = Address::generate(&env);

    let amount: i128 = 1_000_000;
    mint_token(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let client = escrow::EscrowClient::new(&env, &contract_id);

    let nonce = client.create_escrow(&depositor, &beneficiary, &resolver, &token, &amount);

    client.release_escrow(&attacker, &nonce);
}

#[test]
#[should_panic(expected = "escrow must be in Created status")]
fn test_release_escrow_already_released() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);

    let amount: i128 = 1_000_000;
    mint_token(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let client = escrow::EscrowClient::new(&env, &contract_id);

    let nonce = client.create_escrow(&depositor, &beneficiary, &resolver, &token, &amount);
    client.release_escrow(&beneficiary, &nonce);
    client.release_escrow(&beneficiary, &nonce);
}

#[test]
fn test_refund_escrow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);

    let amount: i128 = 1_000_000;
    mint_token(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let client = escrow::EscrowClient::new(&env, &contract_id);

    let nonce = client.create_escrow(&depositor, &beneficiary, &resolver, &token, &amount);

    client.refund_escrow(&depositor, &nonce);

    env.as_contract(&contract_id, || {
        let data: EscrowData = env.storage().persistent().get(&escrow::DataKey::Escrow(0)).unwrap();
        assert_eq!(data.status, EscrowStatus::Refunded);
    });

    let token_client = TokenClient::new(&env, &token);
    assert_eq!(token_client.balance(&contract_id), 0);
    assert_eq!(token_client.balance(&depositor), amount);
}

#[test]
#[should_panic(expected = "caller must be depositor")]
fn test_refund_escrow_unauthorized() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);

    let amount: i128 = 1_000_000;
    mint_token(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let client = escrow::EscrowClient::new(&env, &contract_id);

    let nonce = client.create_escrow(&depositor, &beneficiary, &resolver, &token, &amount);

    client.refund_escrow(&beneficiary, &nonce);
}

#[test]
#[should_panic(expected = "escrow must be in Created status")]
fn test_refund_escrow_after_release() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);

    let amount: i128 = 1_000_000;
    mint_token(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let client = escrow::EscrowClient::new(&env, &contract_id);

    let nonce = client.create_escrow(&depositor, &beneficiary, &resolver, &token, &amount);
    client.release_escrow(&beneficiary, &nonce);
    client.refund_escrow(&depositor, &nonce);
}

#[test]
#[should_panic(expected = "amount must be positive")]
fn test_create_escrow_zero_amount() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);
    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);

    let contract_id = env.register(escrow::Escrow, ());
    let client = escrow::EscrowClient::new(&env, &contract_id);

    client.create_escrow(&depositor, &beneficiary, &resolver, &token, &0);
}

#[test]
fn test_store_and_retrieve_escrow() {
    let env = Env::default();
    let contract_id = env.register(escrow::Escrow, ());

    env.as_contract(&contract_id, || {
        let depositor = Address::generate(&env);
        let beneficiary = Address::generate(&env);
        let resolver = Address::generate(&env);
        let token = Address::generate(&env);

        let data = EscrowData {
            depositor: depositor.clone(),
            beneficiary: beneficiary.clone(),
            resolver: resolver.clone(),
            token: token.clone(),
            amount: 1_000_000,
            status: EscrowStatus::Created,
            nonce: 1,
            created_at: 12345,
        };

        let key = soroban_sdk::symbol_short!("escrow");
        env.storage().persistent().set(&key, &data);

        let retrieved: EscrowData = env.storage().persistent().get(&key).unwrap();

        assert_eq!(retrieved.depositor, depositor);
        assert_eq!(retrieved.beneficiary, beneficiary);
        assert_eq!(retrieved.resolver, resolver);
        assert_eq!(retrieved.token, token);
        assert_eq!(retrieved.amount, 1_000_000);
        assert_eq!(retrieved.status, EscrowStatus::Created);
        assert_eq!(retrieved.nonce, 1);
        assert_eq!(retrieved.created_at, 12345);
    });
}

#[test]
fn test_escrow_status_variants() {
    assert_ne!(EscrowStatus::Created, EscrowStatus::Released);
    assert_ne!(EscrowStatus::Released, EscrowStatus::Refunded);
    assert_ne!(EscrowStatus::Created, EscrowStatus::Refunded);
}
