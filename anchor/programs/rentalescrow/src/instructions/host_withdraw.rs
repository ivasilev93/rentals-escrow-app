use super::super::state::booking::*;

use anchor_lang::{prelude::*, system_program};
use anchor_spl::{token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked}};
use super::super::errors::*;
use super::super::constants::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct HostWithdrawParams {
    pub booking_id: String,
}

#[derive(Accounts)]
#[instruction(params: HostWithdrawParams)]
pub struct HostWithdraw<'info> {
    //Host
    #[account(mut)]
    pub signer: Signer<'info>,

    //Host token acc
    #[account(mut)]
    pub host_token_account: InterfaceAccount<'info, TokenAccount>,

    //Guest account
    ///CHECK if this account is owned by system program
    #[account(mut)]
    pub guest_account: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [
            BOOK_ESCROW_SEED.as_bytes(),
            params.booking_id.as_bytes(),
            signer.key().as_ref(),
            guest_account.key().as_ref()],
        bump, 
        close = guest_account
    )]
    pub booking_payment: Account<'info, Booking>,

    #[account(
        mut,
        seeds = [
            BOOK_ESCROW_VAULT_SEED.as_bytes(),
            params.booking_id.as_bytes(),
            signer.key().as_ref(),
            guest_account.key().as_ref()
        ],
        bump,
    )]
    pub booking_payment_vault: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>
}

impl HostWithdraw<'_> {
    pub fn handle(ctx: Context<HostWithdraw>, params: HostWithdrawParams) -> Result<()> {
        let clock = Clock::get()?;
        let booking_acc = &mut ctx.accounts.booking_payment;

        require!(booking_acc.state == BookingState::New, AppError::BookingInvalid);
        require!(clock.unix_timestamp > booking_acc.end_date, AppError::WithdrawForbidden);
        require!(ctx.accounts.guest_account.owner == &system_program::ID, AppError::InvalidGuestAccount);

        let booking_id_bytes = params.booking_id.as_bytes();
        let host_key = ctx.accounts.signer.key();
        let guest_key = ctx.accounts.guest_account.key();
        let seeds = &[
            BOOK_ESCROW_VAULT_SEED.as_bytes(),
            booking_id_bytes,
            host_key.as_ref(),
            guest_key.as_ref(),
            &[ctx.bumps.booking_payment_vault],
        ];

        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = TransferChecked {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.booking_payment_vault.to_account_info(),
            to: ctx.accounts.host_token_account.to_account_info(),
            authority: ctx.accounts.booking_payment_vault.to_account_info()
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context = CpiContext::new_with_signer(
            cpi_program, 
            cpi_accounts, 
            signer_seeds);

        let decimals = ctx.accounts.mint.decimals;
        token_interface::transfer_checked(cpi_context, ctx.accounts.booking_payment_vault.amount, decimals)?;

        msg!("Host sucessfully withdrew payment for booking {}", booking_acc.id);

        let cpi_program = ctx.accounts.token_program.to_account_info();
        //Close escrow vault account
        let cpi_accounts = anchor_spl::token_2022::CloseAccount {
            account: ctx.accounts.booking_payment_vault.to_account_info(),
            destination: ctx.accounts.guest_account.to_account_info(),
            authority: ctx.accounts.booking_payment_vault.to_account_info(),
        };
        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token_interface::close_account(cpi_context)?;
        msg!("Escrow vault account {} closed", ctx.accounts.booking_payment_vault.key().to_string());        

        Ok(())
    }
    
}
