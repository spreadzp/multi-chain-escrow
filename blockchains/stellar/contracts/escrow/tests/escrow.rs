#![cfg(test)]

use soroban_sdk::Env;

use escrow::Escrow;

#[test]
fn test_build() {
    let env = Env::default();
    let _contract_id = env.register(Escrow, ());
}
