#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env};

use escrow::{EscrowData, EscrowStatus};

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
