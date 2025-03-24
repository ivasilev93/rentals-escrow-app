import { getRentalescrowProgram, getRentalescrowProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'

import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

export function useRentalescrowProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getRentalescrowProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getRentalescrowProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['rentalescrow', 'all', { cluster }],
    queryFn: () => program.account.rentalescrow.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['rentalescrow', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods.initialize().accounts({ rentalescrow: keypair.publicKey }).signers([keypair]).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useRentalescrowProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useRentalescrowProgram()

  const accountQuery = useQuery({
    queryKey: ['rentalescrow', 'fetch', { cluster, account }],
    queryFn: () => program.account.rentalescrow.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['rentalescrow', 'close', { cluster, account }],
    mutationFn: () => program.methods.close().accounts({ rentalescrow: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['rentalescrow', 'decrement', { cluster, account }],
    mutationFn: () => program.methods.decrement().accounts({ rentalescrow: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['rentalescrow', 'increment', { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ rentalescrow: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['rentalescrow', 'set', { cluster, account }],
    mutationFn: (value: number) => program.methods.set(value).accounts({ rentalescrow: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}
