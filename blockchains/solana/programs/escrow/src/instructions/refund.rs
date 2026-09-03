use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

use crate::state::{EscrowAccount, EscrowStatus, SEED_PREFIX};

/// Event emitted when tokens are refunded to depositor.
#[event]
pub struct RefundedEvent {
    pub escrow_pda: Pubkey,
    pub depositor: Pubkey,
    pub amount: u64,
}

#[derive(Accounts)]
pub struct RefundEscrow<'info> {
    /// The depositor — must sign and must match escrow.depositor.
    #[account(mut)]
    pub signer: Signer<'info>,

    /// Escrow PDA — must match seeds [SEED_PREFIX, depositor, beneficiary, nonce].
    #[account(
        mut,
        seeds = [
            SEED_PREFIX,
            escrow_pda.depositor.as_ref(),
            escrow_pda.beneficiary.as_ref(),
            &escrow_pda.nonce.to_le_bytes(),
        ],
        bump = escrow_pda.bump,
        constraint = escrow_pda.depositor == signer.key() @ RefundError::NotDepositor,
    )]
    pub escrow_pda: Account<'info, EscrowAccount>,

    /// SPL token mint.
    pub mint: Account<'info, Mint>,

    /// Escrow's token account (source of refund transfer).
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = escrow_pda,
    )]
    pub escrow_ata: Account<'info, TokenAccount>,

    /// Depositor's token account (destination of refund).
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = signer,
    )]
    pub depositor_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn refund_escrow(ctx: Context<RefundEscrow>) -> Result<()> {
    let escrow = &ctx.accounts.escrow_pda;

    // Validate status is Created
    require!(escrow.status == EscrowStatus::Created, RefundError::NotCreated);
    // Validate signer is depositor (also enforced by constraint on escrow_pda)
    require!(
        ctx.accounts.signer.key() == escrow.depositor,
        RefundError::NotDepositor
    );

    let amount = escrow.amount;
    let bump = escrow.bump;
    let nonce_le = escrow.nonce.to_le_bytes();
    let bump_bytes = [bump];
    let depositor = escrow.depositor;
    let beneficiary = escrow.beneficiary;
    let escrow_pda_key = escrow.key();
    let signer_key = ctx.accounts.signer.key();

    // CPI: transfer tokens from escrow ATA back to depositor ATA
    // Escrow PDA signs via signer_seeds
    let signer_seeds = EscrowAccount::signer_seeds(
        &depositor,
        &beneficiary,
        &nonce_le,
        &bump_bytes,
    );

    let transfer_cpi_accounts = token::Transfer {
        from: ctx.accounts.escrow_ata.to_account_info(),
        to: ctx.accounts.depositor_ata.to_account_info(),
        authority: ctx.accounts.escrow_pda.to_account_info(),
    };
    let transfer_cpi_program = ctx.accounts.token_program.to_account_info();
    token::transfer(
        CpiContext::new_with_signer(transfer_cpi_program, transfer_cpi_accounts, &[&signer_seeds]),
        amount,
    )?;

    // Update status to Refunded
    let escrow = &mut ctx.accounts.escrow_pda;
    escrow.status = EscrowStatus::Refunded;

    emit!(RefundedEvent {
        escrow_pda: escrow_pda_key,
        depositor: signer_key,
        amount,
    });

    Ok(())
}

#[error_code]
pub enum RefundError {
    #[msg("Escrow status must be Created to refund")]
    NotCreated,
    #[msg("Only the depositor can refund")]
    NotDepositor,
}
