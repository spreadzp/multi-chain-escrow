use soroban_sdk::{token::Client as TokenClient, Address, Env};

use crate::types::{DataKey, EscrowData, EscrowStatus};

pub fn create_escrow(
    env: Env,
    depositor: Address,
    beneficiary: Address,
    resolver: Address,
    token: Address,
    amount: i128,
) -> u64 {
    depositor.require_auth();

    assert!(amount > 0, "amount must be positive");

    let nonce: u64 = env
        .storage()
        .persistent()
        .get(&DataKey::Counter)
        .unwrap_or(0);
    env.storage()
        .persistent()
        .set(&DataKey::Counter, &(nonce + 1));

    let escrow = EscrowData {
        depositor: depositor.clone(),
        beneficiary: beneficiary.clone(),
        resolver,
        token: token.clone(),
        amount,
        status: EscrowStatus::Created,
        nonce,
        created_at: env.ledger().timestamp(),
    };

    env.storage().persistent().set(&DataKey::Escrow(nonce), &escrow);

    TokenClient::new(&env, &token).transfer(
        &depositor,
        &env.current_contract_address(),
        &amount,
    );

    env.events()
        .publish(("Deposited", nonce), (depositor, beneficiary, amount));

    nonce
}
