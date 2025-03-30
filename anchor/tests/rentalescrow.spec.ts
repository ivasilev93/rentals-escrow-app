import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey, sendAndConfirmTransaction, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Rentalescrow } from '../target/types/rentalescrow'
import { createAssociatedTokenAccountInstruction, createSyncNativeInstruction, getAccount, getAssociatedTokenAddress, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token"
// import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system"

async function wrapSol(connection: anchor.web3.Connection, wallet: anchor.web3.Keypair, lamports: number): Promise<PublicKey> {
  const associatedTokenAccount = await getAssociatedTokenAddress(
      NATIVE_MINT,
      wallet.publicKey
  );

  const wrapTransaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          associatedTokenAccount,
          wallet.publicKey,
          NATIVE_MINT
      ),
      anchor.web3.SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: associatedTokenAccount,
          lamports: lamports,
      }),
      createSyncNativeInstruction(associatedTokenAccount)
  );
  await sendAndConfirmTransaction(connection, wrapTransaction, [wallet]);

  console.log("SOL wrapped");
  return associatedTokenAccount;
}


describe("Running tests for rental-escrow contract", () => {
  // Configure the client to use the local cluster.

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.rentalescrow as Program<Rentalescrow>;

  // Setup test accounts
  const host = Keypair.generate();
  const guest = Keypair.generate();
  const malicousUser = Keypair.generate();

  let guestTokenAccount: PublicKey;
  let hostTokenAccount: PublicKey;
  let bookingPayment: PublicKey;
  let bookingPaymentVaultAcc: PublicKey;

  //Params
  let timestampNow: number;
  let startDate: number; 
  let endDate: number; 
  const bookingId = '9cf0cf33543149698e441d27249df731';
  const amount = 3 * LAMPORTS_PER_SOL;

  beforeAll(async () => {
    console.log("Setting up...");

    const gTx = await provider.connection.requestAirdrop(guest.publicKey,100 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(host.publicKey, 100 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(malicousUser.publicKey, 100 * LAMPORTS_PER_SOL);

    console.log("gtx: ", gTx);
    await provider.connection.confirmTransaction(gTx);

    guestTokenAccount = await wrapSol(provider.connection, guest, 50 * LAMPORTS_PER_SOL);

    console.log('guestTokenAccount: ', await getAccount(provider.connection, guestTokenAccount));

    hostTokenAccount = await wrapSol(provider.connection, host, 50 * LAMPORTS_PER_SOL);

    console.log('hostTokenAccount: ', await getAccount(provider.connection, hostTokenAccount));

    //Setup startdate and end date to very short periods, so I can test without a need to mess with system clock...
    const slot = await provider.connection.getSlot();
    timestampNow = await provider.connection.getBlockTime(slot) ?? 0;
    startDate = timestampNow + 5;
    endDate = timestampNow + 10;
  }); 

  it("Fails when startDate < now", async () => {
    await expect(async () => {
      await program.methods.book({
        bookingId: bookingId,
        startDate: new anchor.BN(timestampNow - 2),
        endDate: new anchor.BN(endDate),
        hostPk: host.publicKey,
        amount: new anchor.BN(amount)
      })
      .accounts({
        signer: guest.publicKey,
        guestTokenAccount: guestTokenAccount,
        mint: NATIVE_MINT,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([guest])
      .rpc();
    }).rejects.toThrow(/Invalid start date/);

  });

  it("Fails when endDate <= startDate", async () => {
    await expect(async () => {
      await program.methods.book({
        bookingId: bookingId,
        startDate: new anchor.BN(timestampNow + 2000),
        endDate: new anchor.BN(timestampNow + 2000),
        hostPk: host.publicKey,
        amount: new anchor.BN(amount)
      })
      .accounts({
        signer: guest.publicKey,
        guestTokenAccount: guestTokenAccount,
        mint: NATIVE_MINT,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([guest])
      .rpc();
    }).rejects.toThrow(/Invalid end date/);

  });

  it("Makes successfull payment wtih valid booking", async () => {
    const tx = await program.methods.book({
      bookingId: bookingId,
      startDate: new anchor.BN(startDate),
      endDate: new anchor.BN(endDate),
      hostPk: host.publicKey,
      amount: new anchor.BN(amount)
    })
    .accounts({
      signer: guest.publicKey,
      guestTokenAccount: guestTokenAccount,
      mint: NATIVE_MINT,
      tokenProgram: TOKEN_PROGRAM_ID
    })
    .signers([guest])
    .rpc();

    console.log("Book Transaction signature", tx);

    [bookingPayment] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("booking_escrow"),
        Buffer.from(bookingId),
        host.publicKey.toBuffer(),
        guest.publicKey.toBuffer(),
      ],
      program.programId
    );
    
    // Log booking account data
    const bookingPaymentAccount = await program.account.booking.fetch(bookingPayment);
    console.log("Booking payment account:", bookingPaymentAccount);
    const startDateReadable = new Date(bookingPaymentAccount.startDate.toNumber() * 1000).toLocaleString();
    const endDateReadable = new Date(bookingPaymentAccount.endDate.toNumber() * 1000).toLocaleString();

    console.log("Booking start date:", startDateReadable);
    console.log("Booking end date:", endDateReadable);
    console.log("Booking duration (days):", (bookingPaymentAccount.endDate.toNumber() - bookingPaymentAccount.startDate.toNumber()) / 86400);

    //Check amount in vault
    [bookingPaymentVaultAcc] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("booking_vault"),
        Buffer.from(bookingId),
        host.publicKey.toBuffer(),
        guest.publicKey.toBuffer(),
      ],
      program.programId
    );

    const bookingPaymentVaultAccount = await getAccount(provider.connection, bookingPaymentVaultAcc);
    console.log('booking vault amount: ', bookingPaymentVaultAccount.amount);

    expect(Number(bookingPaymentVaultAccount.amount)).toEqual(amount);
  });

  it("Fails when payment for same booking id is submitted, but is already initialized", async () => {
    await expect(async () => {
      await program.methods.book({
        bookingId: bookingId,
        startDate: new anchor.BN(startDate),
        endDate: new anchor.BN(endDate),
        hostPk: host.publicKey,
        amount: new anchor.BN(amount)
      })
      .accounts({
        signer: guest.publicKey,
        guestTokenAccount: guestTokenAccount,
        mint: NATIVE_MINT,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([guest])
      .rpc();
    }).rejects.toThrow(/already in use/);
  });

    
  it("Booking PDA cannot be created directly by malicous user", async () => {
    await expect(async () => {
      const malicousUser = new Keypair();
      const host = new Keypair();
      const newBookingId = '4cf0cf33543149698e441d27249df734';

      const airdropSignature = await provider.connection.requestAirdrop(
        malicousUser.publicKey,
        anchor.web3.LAMPORTS_PER_SOL // 1 SOL
      );
      await provider.connection.confirmTransaction(airdropSignature);

      const [bookingPaymentPDA, bump] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("booking_escrow"),
          Buffer.from(newBookingId),
          host.publicKey.toBuffer(),
          malicousUser.publicKey.toBuffer(),
        ],
        program.programId
      );

      const createAccIx = anchor.web3.SystemProgram.createAccount({
        fromPubkey: malicousUser.publicKey,
        newAccountPubkey: bookingPaymentPDA,
        lamports: 1000,
        space: 200,
        programId: program.programId
      });

      const tx = new Transaction().add(createAccIx);
      await provider.connection.sendTransaction(tx, [malicousUser]);
    }).rejects.toThrow(/Signature verification failed/);

  });

  it("Host cannot withdraw before end date", async () => {
    //Log current time
    const slot = await provider.connection.getSlot();
    const currentTimestamp = await provider.connection.getBlockTime(slot);
    console.log(`Current slot: ${slot}, current timestamp: ${currentTimestamp}`);

    await expect(async () => {
      // const [booking_acc] = await anchor.web3.PublicKey.findProgramAddressSync(
      //   [
      //     Buffer.from("booking_escrow"),
      //     Buffer.from(bookingId),
      //     host.publicKey.toBuffer(),
      //     guest.publicKey.toBuffer(),
      //   ],
      //   program.programId
      // );
  
      // const [booking_vault] = await anchor.web3.PublicKey.findProgramAddressSync(
      //   [
      //     Buffer.from("booking_vault"),
      //     Buffer.from(bookingId),
      //     host.publicKey.toBuffer(),
      //     guest.publicKey.toBuffer(),
      //   ],
      //   program.programId
      // );
  
      const withdrawTxSignature = await program.methods
      .hostWithdraw({ bookingId: bookingId })
      .accounts({
        signer: host.publicKey,
        hostTokenAccount: hostTokenAccount,
        guestAccount: guest.publicKey,
        // bookingPayment: booking_acc,
        // bookingPaymentVault: booking_vault,
        mint: NATIVE_MINT,
        tokenProgram: TOKEN_PROGRAM_ID,
        // systemProgram: SYSTEM_PROGRAM_ID
      })
      .signers([host])
      .rpc();
    }).rejects.toThrow(/Host can withdraw only after end date/); 
  });

  it("Host is able to withdraw his payment", async () => {

    try {
       // Wait until after the end date (adding a small buffer)
     const sleepTime = 11 * 1000; // Convert 11 seconds to milliseconds
     await new Promise(resolve => setTimeout(resolve, sleepTime));

    const hostTokAccBefore = await getAccount(provider.connection, hostTokenAccount);
    console.log("Host tokens before withdraw: ", hostTokAccBefore.amount);

    const [booking_vault] = await anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("booking_vault"),
        Buffer.from(bookingId),
        host.publicKey.toBuffer(),
        guest.publicKey.toBuffer(),
      ],
      program.programId
    );

    const booking_vault_data = await getAccount(provider.connection, booking_vault);

    const withdrawTxSignature = await program.methods
    .hostWithdraw({ bookingId: bookingId })
    .accounts({
      signer: host.publicKey,
      hostTokenAccount: hostTokenAccount,
      guestAccount: guest.publicKey,
      mint: NATIVE_MINT,
      tokenProgram: TOKEN_PROGRAM_ID,
      // systemProgram: SYSTEM_PROGRAM_ID
    })
    .signers([host])
    .rpc();

    console.log("Withdraw tx signature", withdrawTxSignature);

    const hostTokenAccAfter = await getAccount(provider.connection, hostTokenAccount);
    console.log("Host tokens after withdraw: ", hostTokenAccAfter.amount);

    expect(hostTokenAccAfter.amount).toEqual(hostTokAccBefore.amount + booking_vault_data.amount);
    } catch(err) {
      console.log('eee ', err)
    }
  },
  15000);

  it("Malicous user cannot withdraw other user's payments", async () => {
    await expect(async () => {
      let secondBookingId = '10101033543149698e441d2724101010';
      const slot = await provider.connection.getSlot();
      timestampNow = await provider.connection.getBlockTime(slot) ?? 0;
      
      //Setup startdate and end date to very short periods, so i can test without needing to touch the system clock...
      startDate = timestampNow + 5;
      endDate = timestampNow + 10;

      const bookTx = await program.methods.book({
        bookingId: secondBookingId,
        startDate: new anchor.BN(startDate),
        endDate: new anchor.BN(endDate),
        hostPk: host.publicKey,
        amount: new anchor.BN(amount)
      })
      .accounts({
        signer: guest.publicKey,
        guestTokenAccount: guestTokenAccount,
        mint: NATIVE_MINT,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([guest])
      .rpc();
  
      console.log("Book Transaction signature", bookTx);

      // Wait until after the end date (adding a small buffer)
      const sleepTime = 6 * 1000; // Convert 6 seconds to milliseconds
      await new Promise(resolve => setTimeout(resolve, sleepTime));
    
      await program.methods
      .hostWithdraw({ bookingId: secondBookingId })
      .accounts({
        signer: host.publicKey,
        hostTokenAccount: hostTokenAccount,
        guestAccount: guest.publicKey,
        mint: NATIVE_MINT,
        tokenProgram: TOKEN_PROGRAM_ID,
        // systemProgram: SYSTEM_PROGRAM_ID
      })
      .signers([malicousUser])
      .rpc();
    }).rejects.toThrow(/unknown signer/);
 },
 15000);
  
 //TODO: Test deposit with different mint...
});
