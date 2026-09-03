use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

pub use instructions::create::*;
pub use instructions::refund::*;
pub use state::*;

declare_id!("BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj");

#[program]
pub mod escrow {
    use super::*;

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        beneficiary: Pubkey,
        resolver: Pubkey,
        amount: u64,
        nonce: u64,
    ) -> Result<()> {
        instructions::create::create_escrow(ctx, beneficiary, resolver, amount, nonce)
    }

    pub fn refund_escrow(ctx: Context<RefundEscrow>) -> Result<()> {
        instructions::refund::refund_escrow(ctx)
    }
}
