#![no_std]

use soroban_sdk::{contract, contractimpl};

#[contract]
pub struct Escrow;

#[contractimpl]
impl Escrow {
    // Functions added in later slices:
    // - create_escrow (07-3)
    // - release_escrow (07-4)
    // - refund_escrow (07-5)
}
