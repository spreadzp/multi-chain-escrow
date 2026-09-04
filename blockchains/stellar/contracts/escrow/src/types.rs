use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum EscrowStatus {
    Created = 0,
    Released = 1,
    Refunded = 2,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct EscrowData {
    pub depositor: Address,
    pub beneficiary: Address,
    pub resolver: Address,
    pub token: Address,
    pub amount: i128,
    pub status: EscrowStatus,
    pub nonce: u64,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum DataKey {
    Escrow(u64),
    Counter,
}
