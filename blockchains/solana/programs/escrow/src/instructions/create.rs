use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

use crate::state::{EscrowAccount, EscrowStatus, SEED_PREFIX};

/// Event emitted when tokens are deposited into escrow.
#[event]
pub struct DepositedEvent {
    pub escrow_pda: Pubkey,
    pub depositor: Pubkey,
    pub beneficiary: Pubkey,
    pub amount: u64,
}

#[derive(Accounts)]
#[instruction(beneficiary: Pubkey, resolver: Pubkey, amount: u64, nonce: u64)]
pub struct CreateEscrow<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    /// SPL token mint for the deposited tokens.
    pub mint: Account<'info, Mint>,

    /// Depositor's token account (source of transfer).
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = depositor,
    )]
    pub depositor_ata: Account<'info, TokenAccount>,

    /// Escrow PDA — initialized here, holds the escrow state.
    #[account(
        init,
        payer = depositor,
        space = 8 + EscrowAccount::INIT_SPACE,
        seeds = [
            SEED_PREFIX,
            depositor.key().as_ref(),
            beneficiary.as_ref(),
            &nonce.to_le_bytes(),
        ],
        bump,
    )]
    pub escrow_pda: Account<'info, EscrowAccount>,

    /// Escrow's associated token account (destination of transfer).
    /// Initialized fresh with the escrow PDA.
    #[account(
        init,
        payer = depositor,
        associated_token::mint = mint,
        associated_token::authority = escrow_pda,
    )]
    pub escrow_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_escrow(
    ctx: Context<CreateEscrow>,
    beneficiary: Pubkey,
    resolver: Pubkey,
    amount: u64,
    nonce: u64,
) -> Result<()> {
    require!(amount > 0, EscrowError::InvalidAmount);

    let escrow_pda = &mut ctx.accounts.escrow_pda;
    let bump = ctx.bumps.escrow_pda;
    let clock = Clock::get()?;

    // Write escrow state
    escrow_pda.depositor = ctx.accounts.depositor.key();
    escrow_pda.beneficiary = beneficiary;
    escrow_pda.resolver = resolver;
    escrow_pda.mint = ctx.accounts.mint.key();
    escrow_pda.amount = amount;
    escrow_pda.status = EscrowStatus::Created;
    escrow_pda.nonce = nonce;
    escrow_pda.bump = bump;
    escrow_pda.created_at = clock.unix_timestamp;
    // tx_hash_deposit will be set by the caller via transaction signature
    // For now, zero-initialize; can be updated post-instruction
    escrow_pda.tx_hash_deposit = [0u8; 32];

    // CPI: transfer SPL tokens from depositor ATA to escrow ATA
    let transfer_cpi_accounts = token::Transfer {
        from: ctx.accounts.depositor_ata.to_account_info(),
        to: ctx.accounts.escrow_ata.to_account_info(),
        authority: ctx.accounts.depositor.to_account_info(),
    };
    let transfer_cpi_program = ctx.accounts.token_program.to_account_info();
    token::transfer(
        CpiContext::new(transfer_cpi_program, transfer_cpi_accounts),
        amount,
    )?;

    emit!(DepositedEvent {
        escrow_pda: ctx.accounts.escrow_pda.key(),
        depositor: ctx.accounts.depositor.key(),
        beneficiary,
        amount,
    });

    Ok(())
}

#[error_code]
pub enum EscrowError {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
}
