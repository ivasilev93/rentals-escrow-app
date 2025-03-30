use anchor_lang::prelude::*;

#[error_code]
pub enum AppError {
    #[msg("Invalid booking amount")]
    BookingAmountInvalid,
    #[msg("Invalid start date")]
    StartDateInvalid,
    #[msg("Invalid end date")]
    EndDateInvalid,
    #[msg("Booking already completed")]
    CompletedBooking,
    #[msg("Invalid booking id")]
    BookingIdInvalid,
    #[msg("Booking already initialized")]
    InitializedBooking,
    #[msg("Invalid booking")]
    BookingInvalid,
    #[msg("Host can withdraw only after end date")]
    WithdrawForbidden,
    #[msg("Invalid mint")]
    InvalidMint,
    #[msg("Invalid guest account")]
    InvalidGuestAccount,
}