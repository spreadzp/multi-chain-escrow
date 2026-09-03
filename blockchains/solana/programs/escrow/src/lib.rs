use anchor_lang::prelude::*;

pub mod state;

declare_id!("BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj");

#[program]
pub mod escrow {
    use super::*;

    // Instructions will be added in subsequent slices:
    // - create_escrow (06-3)
    // - release_escrow (06-4)
    // - refund_escrow (06-5)
}
