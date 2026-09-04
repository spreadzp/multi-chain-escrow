use soroban_sdk::{token::Client as TokenClient, Address, Env};

use crate::types::{DataKey, EscrowData, EscrowStatus};

pub fn release_escrow(env: Env, caller: Address, nonce: u64) {
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
        caller == escrow.beneficiary || caller == escrow.resolver,
        "caller must be beneficiary or resolver"
    );

    TokenClient::new(&env, &escrow.token).transfer(
        &env.current_contract_address(),
        &escrow.beneficiary,
        &escrow.amount,
    );

    escrow.status = EscrowStatus::Released;
    env.storage().persistent().set(&DataKey::Escrow(nonce), &escrow);

    env.events()
        .publish(("Released", nonce), (escrow.beneficiary, escrow.amount));
}
