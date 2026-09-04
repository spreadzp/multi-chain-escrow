#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Events as _},
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env, String, xdr,
};

use escrow::{EscrowData, EscrowStatus};

// --- Test helpers ---

fn setup_env_and_token() -> (Env, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let token = env
        .register_stellar_asset_contract_v2(admin.clone())
        .address();
    (env, token)
}

fn mint(env: &Env, token: &Address, to: &Address, amount: i128) {
    StellarAssetClient::new(env, token).mint(to, &amount);
}

fn create_escrow(
    env: &Env,
    contract_id: &Address,
    depositor: &Address,
    beneficiary: &Address,
    resolver: &Address,
    token: &Address,
    amount: i128,
) -> u64 {
    let client = escrow::EscrowClient::new(env, contract_id);
    client.create_escrow(depositor, beneficiary, resolver, token, &amount)
}

fn assert_status(env: &Env, contract_id: &Address, nonce: u64, expected: EscrowStatus) {
    env.as_contract(contract_id, || {
        let data: EscrowData = env
            .storage()
            .persistent()
            .get(&escrow::DataKey::Escrow(nonce))
            .unwrap();
        assert_eq!(data.status, expected);
    });
}

fn assert_balance(env: &Env, token: &Address, account: &Address, expected: i128) {
    let token_client = TokenClient::new(env, token);
    assert_eq!(token_client.balance(account), expected);
}

// --- Happy path tests ---

#[test]
fn test_create_escrow() {
    let (env, token) = setup_env_and_token();

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);
    let amount: i128 = 1_000_000;
    mint(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let nonce = create_escrow(
        &env,
        &contract_id,
        &depositor,
        &beneficiary,
        &resolver,
        &token,
        amount,
    );

    assert_eq!(nonce, 0);

    env.as_contract(&contract_id, || {
        let data: EscrowData = env
            .storage()
            .persistent()
            .get(&escrow::DataKey::Escrow(0))
            .unwrap();
        assert_eq!(data.depositor, depositor);
        assert_eq!(data.beneficiary, beneficiary);
        assert_eq!(data.resolver, resolver);
        assert_eq!(data.token, token);
        assert_eq!(data.amount, amount);
        assert_eq!(data.status, EscrowStatus::Created);
        assert_eq!(data.nonce, 0);

        let counter: u64 = env
            .storage()
            .persistent()
            .get(&escrow::DataKey::Counter)
            .unwrap();
        assert_eq!(counter, 1);
    });

    assert_balance(&env, &token, &depositor, 0);
    assert_balance(&env, &token, &contract_id, amount);
}

#[test]
fn test_create_then_release_full_flow() {
    let (env, token) = setup_env_and_token();

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);
    let amount: i128 = 1_000_000;
    mint(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let nonce = create_escrow(
        &env,
        &contract_id,
        &depositor,
        &beneficiary,
        &resolver,
        &token,
        amount,
    );

    let client = escrow::EscrowClient::new(&env, &contract_id);
    client.release_escrow(&beneficiary, &nonce);

    assert_status(&env, &contract_id, nonce, EscrowStatus::Released);
    assert_balance(&env, &token, &contract_id, 0);
    assert_balance(&env, &token, &beneficiary, amount);
}

#[test]
fn test_create_then_refund_full_flow() {
    let (env, token) = setup_env_and_token();

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);
    let amount: i128 = 1_000_000;
    mint(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let nonce = create_escrow(
        &env,
        &contract_id,
        &depositor,
        &beneficiary,
        &resolver,
        &token,
        amount,
    );

    let client = escrow::EscrowClient::new(&env, &contract_id);
    client.refund_escrow(&depositor, &nonce);

    assert_status(&env, &contract_id, nonce, EscrowStatus::Refunded);
    assert_balance(&env, &token, &contract_id, 0);
    assert_balance(&env, &token, &depositor, amount);
}

// --- Role denial tests ---

#[test]
#[should_panic(expected = "caller must be beneficiary or resolver")]
fn test_release_escrow_unauthorized() {
    let (env, token) = setup_env_and_token();

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);
    let attacker = Address::generate(&env);
    let amount: i128 = 1_000_000;
    mint(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let nonce = create_escrow(
        &env,
        &contract_id,
        &depositor,
        &beneficiary,
        &resolver,
        &token,
        amount,
    );

    let client = escrow::EscrowClient::new(&env, &contract_id);
    client.release_escrow(&attacker, &nonce);
}

#[test]
#[should_panic(expected = "caller must be depositor")]
fn test_refund_escrow_unauthorized() {
    let (env, token) = setup_env_and_token();

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);
    let amount: i128 = 1_000_000;
    mint(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let nonce = create_escrow(
        &env,
        &contract_id,
        &depositor,
        &beneficiary,
        &resolver,
        &token,
        amount,
    );

    let client = escrow::EscrowClient::new(&env, &contract_id);
    client.refund_escrow(&beneficiary, &nonce);
}

// --- Status transition tests ---

#[test]
#[should_panic(expected = "escrow must be in Created status")]
fn test_release_escrow_already_released() {
    let (env, token) = setup_env_and_token();

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);
    let amount: i128 = 1_000_000;
    mint(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let nonce = create_escrow(
        &env,
        &contract_id,
        &depositor,
        &beneficiary,
        &resolver,
        &token,
        amount,
    );

    let client = escrow::EscrowClient::new(&env, &contract_id);
    client.release_escrow(&beneficiary, &nonce);
    client.release_escrow(&beneficiary, &nonce);
}

#[test]
#[should_panic(expected = "escrow must be in Created status")]
fn test_refund_escrow_after_release() {
    let (env, token) = setup_env_and_token();

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);
    let amount: i128 = 1_000_000;
    mint(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let nonce = create_escrow(
        &env,
        &contract_id,
        &depositor,
        &beneficiary,
        &resolver,
        &token,
        amount,
    );

    let client = escrow::EscrowClient::new(&env, &contract_id);
    client.release_escrow(&beneficiary, &nonce);
    client.refund_escrow(&depositor, &nonce);
}

#[test]
#[should_panic(expected = "escrow must be in Created status")]
fn test_release_escrow_after_refund() {
    let (env, token) = setup_env_and_token();

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);
    let amount: i128 = 1_000_000;
    mint(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let nonce = create_escrow(
        &env,
        &contract_id,
        &depositor,
        &beneficiary,
        &resolver,
        &token,
        amount,
    );

    let client = escrow::EscrowClient::new(&env, &contract_id);
    client.refund_escrow(&depositor, &nonce);
    client.release_escrow(&beneficiary, &nonce);
}

#[test]
#[should_panic(expected = "escrow must be in Created status")]
fn test_refund_escrow_already_refunded() {
    let (env, token) = setup_env_and_token();

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);
    let amount: i128 = 1_000_000;
    mint(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let nonce = create_escrow(
        &env,
        &contract_id,
        &depositor,
        &beneficiary,
        &resolver,
        &token,
        amount,
    );

    let client = escrow::EscrowClient::new(&env, &contract_id);
    client.refund_escrow(&depositor, &nonce);
    client.refund_escrow(&depositor, &nonce);
}

// --- Validation tests ---

#[test]
#[should_panic(expected = "amount must be positive")]
fn test_create_escrow_zero_amount() {
    let (env, token) = setup_env_and_token();

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);

    let contract_id = env.register(escrow::Escrow, ());
    let client = escrow::EscrowClient::new(&env, &contract_id);
    client.create_escrow(&depositor, &beneficiary, &resolver, &token, &0);
}

// --- Event verification tests ---

#[test]
fn test_deposited_event() {
    let (env, token) = setup_env_and_token();

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);
    let amount: i128 = 1_000_000;
    mint(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let _nonce = create_escrow(
        &env,
        &contract_id,
        &depositor,
        &beneficiary,
        &resolver,
        &token,
        amount,
    );

    let events = env.events().all();
    assert!(
        events.events().iter().any(|e| {
            if let xdr::ContractEventBody::V0(body) = &e.body {
                if let Some(first_topic) = body.topics.first() {
                    if let Ok(topic) = <String as soroban_sdk::TryFromVal<_, _>>::try_from_val(
                        &env,
                        first_topic,
                    ) {
                        return topic == String::from_str(&env, "Deposited");
                    }
                }
            }
            false
        }),
        "Deposited event not found"
    );
}

#[test]
fn test_released_event() {
    let (env, token) = setup_env_and_token();

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);
    let amount: i128 = 1_000_000;
    mint(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let nonce = create_escrow(
        &env,
        &contract_id,
        &depositor,
        &beneficiary,
        &resolver,
        &token,
        amount,
    );

    let client = escrow::EscrowClient::new(&env, &contract_id);
    client.release_escrow(&beneficiary, &nonce);

    let events = env.events().all();
    assert!(
        events.events().iter().any(|e| {
            if let xdr::ContractEventBody::V0(body) = &e.body {
                if let Some(first_topic) = body.topics.first() {
                    if let Ok(sym) = <String as soroban_sdk::TryFromVal<_, _>>::try_from_val(
                        &env,
                        first_topic,
                    ) {
                        return sym == String::from_str(&env, "Released");
                    }
                }
            }
            false
        }),
        "Released event not found"
    );
}

#[test]
fn test_refunded_event() {
    let (env, token) = setup_env_and_token();

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);
    let amount: i128 = 1_000_000;
    mint(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let nonce = create_escrow(
        &env,
        &contract_id,
        &depositor,
        &beneficiary,
        &resolver,
        &token,
        amount,
    );

    let client = escrow::EscrowClient::new(&env, &contract_id);
    client.refund_escrow(&depositor, &nonce);

    let events = env.events().all();
    assert!(
        events.events().iter().any(|e| {
            if let xdr::ContractEventBody::V0(body) = &e.body {
                if let Some(first_topic) = body.topics.first() {
                    if let Ok(sym) = <String as soroban_sdk::TryFromVal<_, _>>::try_from_val(
                        &env,
                        first_topic,
                    ) {
                        return sym == String::from_str(&env, "Refunded");
                    }
                }
            }
            false
        }),
        "Refunded event not found"
    );
}

// --- Release by resolver ---

#[test]
fn test_release_escrow_by_resolver() {
    let (env, token) = setup_env_and_token();

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);
    let amount: i128 = 500_000;
    mint(&env, &token, &depositor, amount);

    let contract_id = env.register(escrow::Escrow, ());
    let nonce = create_escrow(
        &env,
        &contract_id,
        &depositor,
        &beneficiary,
        &resolver,
        &token,
        amount,
    );

    let client = escrow::EscrowClient::new(&env, &contract_id);
    client.release_escrow(&resolver, &nonce);

    assert_balance(&env, &token, &beneficiary, amount);
}

// --- Multiple escrows ---

#[test]
fn test_multiple_escrows_nonce_increment() {
    let (env, token) = setup_env_and_token();

    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let resolver = Address::generate(&env);
    let amount: i128 = 500_000;
    mint(&env, &token, &depositor, amount * 3);

    let contract_id = env.register(escrow::Escrow, ());

    let nonce0 = create_escrow(
        &env,
        &contract_id,
        &depositor,
        &beneficiary,
        &resolver,
        &token,
        amount,
    );
    let nonce1 = create_escrow(
        &env,
        &contract_id,
        &depositor,
        &beneficiary,
        &resolver,
        &token,
        amount,
    );
    let nonce2 = create_escrow(
        &env,
        &contract_id,
        &depositor,
        &beneficiary,
        &resolver,
        &token,
        amount,
    );

    assert_eq!(nonce0, 0);
    assert_eq!(nonce1, 1);
    assert_eq!(nonce2, 2);

    assert_balance(&env, &token, &contract_id, amount * 3);
}

// --- Basic data structure tests ---

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
