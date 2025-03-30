use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, InitSpace, Clone, PartialEq, Eq)]
pub enum BookingState {
    None,
    New
}

#[account]
#[derive(InitSpace)]
pub struct Booking {
    #[max_len(32)]
    pub id: String,
    pub start_date: i64,
    pub end_date: i64,
    pub state: BookingState,
    pub bump: u8
}