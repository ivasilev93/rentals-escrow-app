mod state;
mod errors;
mod instructions;
mod constants;

use instructions::book::*;
use instructions::host_withdraw::*;
use anchor_lang::prelude::*;

// #![allow(clippy::result_large_err)]
declare_id!("Eb6EE58yZdHSVrqNoB47hajyNGwe2PxCNf8EacmrhTmu");

#[program]
pub mod rentalescrow {
    use super::*;

    pub fn book(ctx: Context<BookInstruction>, params: BookInstructionParams) -> Result<()> {
      BookInstruction::handle(ctx, params)
    }

    pub fn host_withdraw(ctx: Context<HostWithdraw>, params: HostWithdrawParams) -> Result<()> {
        HostWithdraw::handle(ctx, params)
    }
}
