import { ReactNode, Suspense, useEffect, useRef, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'

import { ClusterUiSelect, ExplorerLink } from '../cluster/cluster-ui'
import { WalletButton } from '../solana/solana-provider'

export function UiLayout({ children, links }: { children: React.ReactNode; links: { label: string; path: string }[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useLocation().pathname;

  return (
    <div className="h-full flex flex-col">
      {/* Navbar */}
      <div className="navbar bg-base-300 dark:text-neutral-content px-4">
        <div className="flex-1 flex items-center">
          <Link className="btn btn-ghost normal-case text-xl" to="/">
            Rental Escrow
          </Link>
          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex ml-4">
            <ul className="menu menu-horizontal px-1 space-x-2">
              {links.map(({ label, path }) => (
                <li key={path}>
                  <Link className={pathname.startsWith(path) ? "active" : ""} to={path}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Side: Wallet & Cluster (Desktop) + Mobile Menu Button */}
        <div className="flex items-center space-x-2">
          <div className="hidden md:flex space-x-2">
            <WalletButton />
            <ClusterUiSelect />
          </div>
          <button
            className="md:hidden btn btn-square btn-ghost"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-base-300 p-4">
          <ul className="menu flex flex-col space-y-2 mb-4">
            {links.map(({ label, path }) => (
              <li key={path}>
                <Link 
                  className={pathname.startsWith(path) ? "active" : ""} 
                  to={path} 
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex space-x-2 justify-center">
            <WalletButton />
            <ClusterUiSelect />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-grow mx-4 lg:mx-auto">
        <Suspense
          fallback={
            <div className="text-center my-32">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          }
        >
          {children}
        </Suspense>
        <Toaster position="bottom-right" />
      </div>
    </div>
  );
}

export function AppModal({
  children,
  title,
  hide,
  show,
  submit,
  submitDisabled,
  submitLabel,
}: {
  children: ReactNode
  title: string
  hide: () => void
  show: boolean
  submit?: () => void
  submitDisabled?: boolean
  submitLabel?: string
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    if (!dialogRef.current) return
    if (show) {
      dialogRef.current.showModal()
    } else {
      dialogRef.current.close()
    }
  }, [show, dialogRef])

  return (
    <dialog className="modal" ref={dialogRef}>
      <div className="modal-box space-y-5">
        <h3 className="font-bold text-lg">{title}</h3>
        {children}
        <div className="modal-action">
          <div className="join space-x-2">
            {submit ? (
              <button className="btn btn-xs lg:btn-md btn-primary" onClick={submit} disabled={submitDisabled}>
                {submitLabel || 'Save'}
              </button>
            ) : null}
            <button onClick={hide} className="btn">
              Close
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

export function AppHero({
  children,
  title,
  subtitle,
}: {
  children?: ReactNode
  title: ReactNode
  subtitle: ReactNode
}) {
  return (
    <div className="hero py-[64px]">
      <div className="hero-content text-center">
        <div className="max-w-2xl">
          {typeof title === 'string' ? <h1 className="text-5xl font-bold">{title}</h1> : title}
          {typeof subtitle === 'string' ? <p className="py-6">{subtitle}</p> : subtitle}
          {children}
        </div>
      </div>
    </div>
  )
}

export function ellipsify(str = '', len = 4) {
  if (str.length > 30) {
    return str.substring(0, len) + '..' + str.substring(str.length - len, str.length)
  }
  return str
}

export function useTransactionToast() {
  return (signature: string) => {
    toast.success(
      <div className={'text-center'}>
        <div className="text-lg">Transaction sent</div>
        <ExplorerLink path={`tx/${signature}`} label={'View Transaction'} className="btn btn-xs btn-primary" />
      </div>,
    )
  }
}
