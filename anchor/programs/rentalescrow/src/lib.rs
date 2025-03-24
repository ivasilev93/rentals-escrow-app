#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod rentalescrow {
    use super::*;

  pub fn close(_ctx: Context<CloseRentalescrow>) -> Result<()> {
    Ok(())
  }

  pub fn decrement(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.rentalescrow.count = ctx.accounts.rentalescrow.count.checked_sub(1).unwrap();
    Ok(())
  }

  pub fn increment(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.rentalescrow.count = ctx.accounts.rentalescrow.count.checked_add(1).unwrap();
    Ok(())
  }

  pub fn initialize(_ctx: Context<InitializeRentalescrow>) -> Result<()> {
    Ok(())
  }

  pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
    ctx.accounts.rentalescrow.count = value.clone();
    Ok(())
  }
}

#[derive(Accounts)]
pub struct InitializeRentalescrow<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  init,
  space = 8 + Rentalescrow::INIT_SPACE,
  payer = payer
  )]
  pub rentalescrow: Account<'info, Rentalescrow>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseRentalescrow<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
  pub rentalescrow: Account<'info, Rentalescrow>,
}

#[derive(Accounts)]
pub struct Update<'info> {
  #[account(mut)]
  pub rentalescrow: Account<'info, Rentalescrow>,
}

#[account]
#[derive(InitSpace)]
pub struct Rentalescrow {
  count: u8,
}
