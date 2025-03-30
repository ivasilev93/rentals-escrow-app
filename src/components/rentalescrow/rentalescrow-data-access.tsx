import { getRentalescrowProgram, getRentalescrowProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, LAMPORTS_PER_SOL, PublicKey, SendTransactionError, SystemProgram, Transaction } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'

import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'
import { createAssociatedTokenAccountInstruction, createSyncNativeInstruction, getAssociatedTokenAddress, NATIVE_MINT, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { BN } from '@coral-xyz/anchor'
import { WalletSignTransactionError } from '@solana/wallet-adapter-base'

// Serving imgs w the fe app... i know.. i know... 
import  mainPic from '../../assets/main.jpg'
import  pic1 from '../../assets/1.jpg'
import  pic2 from '../../assets/2.jpg'
import  pic3 from '../../assets/3.jpg'
import  pic4 from '../../assets/4.jpg'
import  hostPic from '../../assets/pepe.jpg'
// import { publicKey } from '@coral-xyz/anchor/dist/cjs/utils'

export interface PropertyData {
  name: string,
  location: string,
  pricePerNight: number,
  description: string,
  host: {
    name: string,
    profilePic: string,
    hostSince: string
  },
  images: string[],
  hostPublicKey: string
}

interface BookInstructionParams {
  bookingId: String,
  checkInTimestamp: number,
  checkOutTimestamp: number,
  hostPk: string,
  usdAmountInLamports: number,
}

interface WithdrawInstructionParams {
  bookingId: String,
  guestPk: string,
}
interface AnchorError {
  errorCode: string;
  errorNumber: number;
  errorMessage: string;
}

export function getPropertyData() :PropertyData {
  //Usually call to backend...

  const date = new Date();
  const checkout = new Date();
  checkout.setDate(date.getDate() + 1);

  const property = {
    name: "Beachfront Villa",
    location: "Malibu, California",
    pricePerNight: 340,
    description: "Yo, it’s John here. Got a chill beachfront villa for you—3 beds, killer ocean views, private pool, and straight-up beach access. Book it easy with the Solana escrow dApp, pay in SOL, and you’re set. Good for fam trips, low-key getaway or if u need somewhere to hide and cry, cuz u bought the top again. Let’s roll.",
    host: {
      name: 'John Doe',
      profilePic: hostPic,
      hostSince: 'May 2023'
    },
    images: [
      mainPic, pic1, pic2, pic3, pic4
    ],
    hostPublicKey: '...dummyData' //In prod settings should be already set up by host and fetched from teh web app backend
  }

  return property;
}

export function useRentalescrowProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getRentalescrowProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getRentalescrowProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['rentalescrow', 'all', { cluster }],
    queryFn: () => program.account.booking.all(),
  })

  const book = useMutation<string, Error, BookInstructionParams>({
    mutationKey: ['rentalescrow', 'book', { cluster }],
    mutationFn: async ({bookingId, checkInTimestamp, checkOutTimestamp, hostPk, usdAmountInLamports}) =>
      {
        const signer = provider.wallet.publicKey;
        const guestwSolTokenAcc: PublicKey = await getAssociatedTokenAddress(NATIVE_MINT, signer, false);
        const accInfo = await connection.getAccountInfo(guestwSolTokenAcc);
        let transaction = new Transaction();
        
        if (!accInfo) {
          console.log('Adding Create ATA Ix...')

          transaction.add(
            createAssociatedTokenAccountInstruction(
              signer,
              guestwSolTokenAcc,
              signer,
              NATIVE_MINT,
            )
          );
        }      

        const minSolRequired = usdAmountInLamports / LAMPORTS_PER_SOL + 0.002; // Booking amount + ATA rent
        const solBalance = await connection.getBalance(signer);
        const guestTokenAccBalance = accInfo ? await connection.getTokenAccountBalance(guestwSolTokenAcc) : null;

        const wSolBalance = accInfo ? guestTokenAccBalance?.value.uiAmount || 0 : 0;
  
        if (solBalance < minSolRequired * LAMPORTS_PER_SOL) {
          throw new Error('Insufficient SOL balance to complete booking');
        }

        if (wSolBalance < usdAmountInLamports / LAMPORTS_PER_SOL) {
          const wrapAmount = Math.ceil((usdAmountInLamports / LAMPORTS_PER_SOL - wSolBalance) * LAMPORTS_PER_SOL);
          transaction.add(
            SystemProgram.transfer({
              fromPubkey: signer,
              toPubkey: guestwSolTokenAcc,
              lamports: wrapAmount,
            }),
            createSyncNativeInstruction(guestwSolTokenAcc)
          );
        }

        //Derive PDAs
        const hostPublicKey = new PublicKey(hostPk);
        const [bookingPayment, ] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("booking_escrow"),
            Buffer.from(bookingId),
            hostPublicKey.toBuffer(),
            signer.toBuffer(),
          ],
          programId
        );
  
        const [bookingPaymentVault, ] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("booking_vault"),
            Buffer.from(bookingId),
            hostPublicKey.toBuffer(),
            signer.toBuffer(),
          ],
          programId
        );

        const bookIx = await program.methods.book({
          bookingId: bookingId,
          startDate: new BN(checkInTimestamp),
          endDate: new BN(checkOutTimestamp),
          hostPk: hostPublicKey,
          amount: new BN(usdAmountInLamports),
        })
        .accountsStrict({
          signer: signer,
          guestTokenAccount: guestwSolTokenAcc,
          bookingPayment: bookingPayment,
          bookingPaymentVault: bookingPaymentVault,
          mint: NATIVE_MINT,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        })
        .instruction();

        transaction.add(bookIx); 
        const signature = await provider.sendAndConfirm(transaction);

        const bookingData = {
          bookingId,
          guestPk: provider.wallet.publicKey.toBase58(),
          hostPk,
          amount: usdAmountInLamports / LAMPORTS_PER_SOL,
          checkInTimestamp: checkInTimestamp,
          checkOutTimestamp: checkOutTimestamp,
          txSignature: signature,
        };
        const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
        bookings.push(bookingData);
        localStorage.setItem("bookings", JSON.stringify(bookings));

        return signature;
      },
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error('Failed to make a booking')
  });

  const withdraw = useMutation<string, Error, WithdrawInstructionParams>({
    mutationKey: ['rentalescrow', 'host_withdraw', { cluster }],
    mutationFn: async ({bookingId, guestPk}) => {
      const signer = provider.wallet.publicKey;
      const hostTokenAcc: PublicKey = await getAssociatedTokenAddress(NATIVE_MINT, signer, false);
      let transaction = new Transaction();      

      const hostTokenAccInfo = await connection.getAccountInfo(hostTokenAcc);
      if (!hostTokenAccInfo) {
        console.log('Adding Create ATA Ix for Host token acc...');

        transaction.add(
          createAssociatedTokenAccountInstruction(
            signer,
            hostTokenAcc,
            signer,
            NATIVE_MINT,
          )
        );
      }  

      //Derive PDAs
      const [bookingPayment, ] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("booking_escrow"),
          Buffer.from(bookingId),
          signer.toBuffer(),
          new PublicKey(guestPk).toBuffer(),
        ],
        programId
      );

      const [bookingPaymentVault, ] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("booking_vault"),
          Buffer.from(bookingId),
          signer.toBuffer(),
          new PublicKey(guestPk).toBuffer(),
        ],
        programId
      );

      const withdrawIx = await program.methods.hostWithdraw({
        bookingId: bookingId
      })
      .accountsStrict({
        signer: signer,
        hostTokenAccount: hostTokenAcc,
        guestAccount: new PublicKey(guestPk),
        bookingPayment: bookingPayment,
        bookingPaymentVault: bookingPaymentVault,
        mint: NATIVE_MINT,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      })
      .instruction();

      transaction.add(withdrawIx);
      const signature = await provider.sendAndConfirm(transaction);
      return signature;
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      console.log('Withdraw signature: ', signature);
      return accounts.refetch();
    },
    onError: async (err) => {
      //Not all errors are user friendly. Will show specific message for the ones where user has control over.
      if (err instanceof SendTransactionError) {
        const logs = await err.getLogs(connection);
        const anchorErrorMatch = logs.find((log) => log.includes('AnchorError thrown'));

        if (anchorErrorMatch) {
          const errorCodeMatch = anchorErrorMatch.match(/Error Code: (\w+)/);
          const errorNumberMatch = anchorErrorMatch.match(/Error Number: (\d+)/);
          const errorMessageMatch = anchorErrorMatch.match(/Error Message: (.+)$/);

          const customError: AnchorError = {
            errorCode: errorCodeMatch ? errorCodeMatch[1] : 'Unknown',
            errorNumber: errorNumberMatch ? parseInt(errorNumberMatch[1], 10) : 0,
            errorMessage: errorMessageMatch ? errorMessageMatch[1] : 'Unknown error',
          };

          if (customError.errorCode == 'WithdrawForbidden') {
            toast.error(customError.errorMessage);
            return;
          }
        }
      } else if (err instanceof WalletSignTransactionError) {
        toast.error(err.message);
      } else {
        toast.error('Could not withdraw. Please contact support.');
      }

    }
  });

  return {
    program,
    programId,
    accounts,
    book,
    withdraw
  }
}

export async function fetchSolPrice(): Promise<number | null> {
  const url = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";

  try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      return data.solana.usd;
  } catch (error) {
      console.error("Error fetching SOL price:", error);
      return null;
  }
}
