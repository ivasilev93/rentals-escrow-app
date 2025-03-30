// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import RentalescrowIDL from '../target/idl/rentalescrow.json'
import type { Rentalescrow } from '../target/types/rentalescrow'

// Re-export the generated IDL and type
export { Rentalescrow, RentalescrowIDL }

// The programId is imported from the program IDL.
export const RENTALESCROW_PROGRAM_ID = new PublicKey(RentalescrowIDL.address)

// This is a helper function to get the Rentalescrow Anchor program.
export function getRentalescrowProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...RentalescrowIDL, address: address ? address.toBase58() : RentalescrowIDL.address } as Rentalescrow, provider)
}

// This is a helper function to get the program ID for the Rentalescrow program depending on the cluster.
export function getRentalescrowProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Rentalescrow program on devnet and testnet.
      return new PublicKey('Eb6EE58yZdHSVrqNoB47hajyNGwe2PxCNf8EacmrhTmu')
    case 'mainnet-beta':
    default:
      return RENTALESCROW_PROGRAM_ID
  }
}
