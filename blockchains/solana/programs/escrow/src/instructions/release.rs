use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

use crate::state::{EscrowAccount, EscrowStatus, SEED_PREFIX};

/// Event emitted when tokens are released to beneficiary.
#[event]
pub struct ReleasedEvent {
    pub escrow_pda: Pubkey,
    pub beneficiary: Pubkey,
    pub amount: u64,
}

#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    /// The signer — must be beneficiary or resolver.
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
        constraint = escrow_pda.beneficiary == signer.key() || escrow_pda.resolver == signer.key()
            @ ReleaseError::NotAuthorized,
    )]
    pub escrow_pda: Account<'info, EscrowAccount>,

    /// SPL token mint.
    pub mint: Account<'info, Mint>,

    /// Escrow's token account (source of release transfer).
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = escrow_pda,
    )]
    pub escrow_ata: Account<'info, TokenAccount>,

    /// Beneficiary's token account (destination of release).
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = escrow_pda.beneficiary,
    )]
    pub beneficiary_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn release_escrow(ctx: Context<ReleaseEscrow>) -> Result<()> {
    let escrow = &ctx.accounts.escrow_pda;

    // Validate status is Created
    require!(
        escrow.status == EscrowStatus::Created,
        ReleaseError::NotCreated
    );

    let amount = escrow.amount;
    let bump = escrow.bump;
    let nonce_le = escrow.nonce.to_le_bytes();
    let bump_bytes = [bump];
    let depositor = escrow.depositor;
    let beneficiary = escrow.beneficiary;
    let escrow_pda_key = escrow.key();

    // CPI: transfer tokens from escrow ATA to beneficiary ATA
    // Escrow PDA signs via signer_seeds
    let signer_seeds =
        EscrowAccount::signer_seeds(&depositor, &beneficiary, &nonce_le, &bump_bytes);

    let transfer_cpi_accounts = token::Transfer {
        from: ctx.accounts.escrow_ata.to_account_info(),
        to: ctx.accounts.beneficiary_ata.to_account_info(),
        authority: ctx.accounts.escrow_pda.to_account_info(),
    };
    let transfer_cpi_program = ctx.accounts.token_program.to_account_info();
    token::transfer(
        CpiContext::new_with_signer(
            transfer_cpi_program,
            transfer_cpi_accounts,
            &[&signer_seeds],
        ),
        amount,
    )?;

    // Update status to Released
    let escrow = &mut ctx.accounts.escrow_pda;
    escrow.status = EscrowStatus::Released;

    emit!(ReleasedEvent {
        escrow_pda: escrow_pda_key,
        beneficiary,
        amount,
    });

    Ok(())
}

#[error_code]
pub enum ReleaseError {
    #[msg("Escrow status must be Created to release")]
    NotCreated,
    #[msg("Only beneficiary or resolver can release")]
    NotAuthorized,
}
