#![no_std]

mod functions;
mod types;

use soroban_sdk::{contract, contractimpl, Address, Env};

pub use types::{DataKey, EscrowData, EscrowStatus};

#[contract]
pub struct Escrow;

#[contractimpl]
impl Escrow {
    pub fn create_escrow(
        env: Env,
        depositor: Address,
        beneficiary: Address,
        resolver: Address,
        token: Address,
        amount: i128,
    ) -> u64 {
        functions::create_escrow(env, depositor, beneficiary, resolver, token, amount)
    }
}
