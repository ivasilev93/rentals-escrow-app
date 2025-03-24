import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair } from '@solana/web3.js'
import { Rentalescrow } from '../target/types/rentalescrow'

describe('rentalescrow', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Rentalescrow as Program<Rentalescrow>

  const rentalescrowKeypair = Keypair.generate()

  it('Initialize Rentalescrow', async () => {
    await program.methods
      .initialize()
      .accounts({
        rentalescrow: rentalescrowKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([rentalescrowKeypair])
      .rpc()

    const currentCount = await program.account.rentalescrow.fetch(rentalescrowKeypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment Rentalescrow', async () => {
    await program.methods.increment().accounts({ rentalescrow: rentalescrowKeypair.publicKey }).rpc()

    const currentCount = await program.account.rentalescrow.fetch(rentalescrowKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment Rentalescrow Again', async () => {
    await program.methods.increment().accounts({ rentalescrow: rentalescrowKeypair.publicKey }).rpc()

    const currentCount = await program.account.rentalescrow.fetch(rentalescrowKeypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement Rentalescrow', async () => {
    await program.methods.decrement().accounts({ rentalescrow: rentalescrowKeypair.publicKey }).rpc()

    const currentCount = await program.account.rentalescrow.fetch(rentalescrowKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set rentalescrow value', async () => {
    await program.methods.set(42).accounts({ rentalescrow: rentalescrowKeypair.publicKey }).rpc()

    const currentCount = await program.account.rentalescrow.fetch(rentalescrowKeypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the rentalescrow account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        rentalescrow: rentalescrowKeypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.rentalescrow.fetchNullable(rentalescrowKeypair.publicKey)
    expect(userAccount).toBeNull()
  })
})
