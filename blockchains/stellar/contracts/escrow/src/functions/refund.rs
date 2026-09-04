use soroban_sdk::{token::Client as TokenClient, Address, Env};

use crate::types::{DataKey, EscrowData, EscrowStatus};

pub fn refund_escrow(env: Env, caller: Address, nonce: u64) {
    caller.require_auth();

    let mut escrow: EscrowData = env
        .storage()
        .persistent()
        .get(&DataKey::Escrow(nonce))
        .unwrap_or_else(|| panic!("escrow {} not found", nonce));

    assert!(
        escrow.status == EscrowStatus::Created,
        "escrow must be in Created status"
    );

    assert!(
        caller == escrow.depositor,
        "caller must be depositor"
    );

    TokenClient::new(&env, &escrow.token).transfer(
        &env.current_contract_address(),
        &escrow.depositor,
        &escrow.amount,
    );

    escrow.status = EscrowStatus::Refunded;
    env.storage().persistent().set(&DataKey::Escrow(nonce), &escrow);

    env.events()
        .publish(("Refunded", nonce), (escrow.depositor, escrow.amount));
}
