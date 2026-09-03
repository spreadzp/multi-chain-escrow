use anchor_lang::prelude::*;

/// PDA seed prefix for escrow account derivation.
pub const SEED_PREFIX: &[u8] = b"escrow";

/// Escrow status lifecycle states.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum EscrowStatus {
    /// Escrow created, tokens deposited, awaiting release or refund.
    Created,
    /// Tokens released to beneficiary. Terminal state.
    Released,
    /// Tokens refunded to depositor. Terminal state.
    Refunded,
}

/// On-chain escrow account storing the full escrow state.
///
/// PDA seeds: `[SEED_PREFIX, depositor, beneficiary, nonce]`
#[account]
#[derive(InitSpace)]
pub struct EscrowAccount {
    /// The party depositing tokens into escrow.
    pub depositor: Pubkey,
    /// The party receiving tokens upon release.
    pub beneficiary: Pubkey,
    /// Optional resolver/arbitrator (can be depositor for self-resolve).
    pub resolver: Pubkey,
    /// SPL token mint address for the deposited tokens.
    pub mint: Pubkey,
    /// Amount of tokens held in escrow (in base units).
    pub amount: u64,
    /// Current lifecycle status.
    pub status: EscrowStatus,
    /// Unique nonce for PDA derivation (allows multiple escrows between same parties).
    pub nonce: u64,
    /// Bump seed for PDA.
    pub bump: u8,
    /// Unix timestamp of escrow creation.
    pub created_at: i64,
    /// Transaction hash of the deposit transaction (32 bytes).
    pub tx_hash_deposit: [u8; 32],
}

impl EscrowAccount {
    /// Returns the PDA seeds for deriving an escrow account.
    /// Caller must provide the nonce as little-endian bytes to avoid lifetime issues.
    pub fn pda_seeds<'a>(
        depositor: &'a Pubkey,
        beneficiary: &'a Pubkey,
        nonce_le_bytes: &'a [u8; 8],
    ) -> Vec<&'a [u8]> {
        vec![
            SEED_PREFIX,
            depositor.as_ref(),
            beneficiary.as_ref(),
            nonce_le_bytes,
        ]
    }

    /// Returns the full signer seeds (including bump) for CPI calls.
    /// Caller must provide nonce and bump as byte references to avoid lifetime issues.
    pub fn signer_seeds<'a>(
        depositor: &'a Pubkey,
        beneficiary: &'a Pubkey,
        nonce_le_bytes: &'a [u8; 8],
        bump_bytes: &'a [u8; 1],
    ) -> [&'a [u8]; 5] {
        [
            SEED_PREFIX,
            depositor.as_ref(),
            beneficiary.as_ref(),
            nonce_le_bytes,
            bump_bytes,
        ]
    }
}
