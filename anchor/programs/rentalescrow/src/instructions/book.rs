use std::str::FromStr;

use super::super::state::booking::*;
use super::super::errors::*;

use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use super::super::constants::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct BookInstructionParams {
    pub booking_id: String,
    pub start_date: i64,
    pub end_date: i64,
    pub host_pk: Pubkey,
    pub amount: u64,
    //More room for cancellation policy configs
}

#[derive(Accounts)]
#[instruction(params: BookInstructionParams)]
pub struct BookInstruction<'info> {   
    //Guest
    #[account(mut)]
    pub signer: Signer<'info>,  

    //Guest token acc
    #[account(
        mut,
        token::mint = mint,
    )]
    pub guest_token_account: InterfaceAccount<'info, TokenAccount>,
    
    #[account(
        init,
        seeds = [
            BOOK_ESCROW_SEED.as_bytes(),
            params.booking_id.as_bytes(),
            params.host_pk.key().as_ref(),
            signer.key().as_ref()],
        bump,
        payer = signer,
        space = 8 + Booking::INIT_SPACE
    )]
    pub booking_payment: Account<'info, Booking>,

    #[account(
        init,
        payer = signer,
        token::mint = mint,
        token::authority = booking_payment_vault,
        token::token_program = token_program,
        seeds = [
            BOOK_ESCROW_VAULT_SEED.as_bytes(),
            params.booking_id.as_bytes(),
            params.host_pk.key().as_ref(),
            signer.key().as_ref()
        ],
        bump
    )]
    pub booking_payment_vault: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>
}

impl BookInstruction<'_> {
    pub fn handle(ctx: Context<BookInstruction>, params: BookInstructionParams) -> Result<()> {
        let clock = Clock::get()?;
        let booking_acc = &mut ctx.accounts.booking_payment;
        let wsol_mint: Pubkey = Pubkey::from_str(WSOL_ADDRESS).unwrap();

        require!(ctx.accounts.guest_token_account.mint.key() == wsol_mint.key(), AppError::InvalidMint);
        require!(params.amount > 0, AppError::BookingAmountInvalid);
        require!(params.start_date > clock.unix_timestamp, AppError::StartDateInvalid);
        require!(params.end_date > params.start_date, AppError::EndDateInvalid);
        require!(params.booking_id.len() == 32, AppError::BookingIdInvalid);
        
        require!(booking_acc.state == BookingState::None, AppError::InitializedBooking);        

        booking_acc.id = params.booking_id;
        booking_acc.start_date = params.start_date;
        booking_acc.end_date = params.end_date;
        booking_acc.bump = ctx.bumps.booking_payment;
        booking_acc.state = BookingState::New;

        let cpi_accounts = TransferChecked {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.guest_token_account.to_account_info(),
            to: ctx.accounts.booking_payment_vault.to_account_info(),
            authority: ctx.accounts.signer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        let decimals = ctx.accounts.mint.decimals;
        token_interface::transfer_checked(cpi_context, params.amount, decimals)?;     

        msg!("Successful payment for booking {}", booking_acc.id);  

        Ok(())
    }
}