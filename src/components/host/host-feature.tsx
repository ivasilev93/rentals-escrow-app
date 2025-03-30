
import { useEffect, useState } from 'react'
import { useRentalescrowProgram } from '../rentalescrow/rentalescrow-data-access'
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '../solana/solana-provider';
import toast from 'react-hot-toast';

interface BookingRecord {
    bookingId: string,
    hostPk: string,
    guestPk: string,
    amount: number,
    checkInTimestamp: number,
    checkOutTimestamp: number,
    txSignature: string,
  }

export default function HostFeature() {
    const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});

    const { withdraw } = useRentalescrowProgram();
    const { publicKey } = useWallet();
    const [bookings, setBookings] = useState<BookingRecord[]>(() => {
        return JSON.parse(localStorage.getItem("bookings") || "[]");
    });

    useEffect(() => {
        localStorage.setItem("bookings", JSON.stringify(bookings));
    }, [bookings]);

    const handleWithdraw = async (bookingId: string, guestPk: string) => {
        try {

            setIsLoading((prev) => ({ ...prev, [bookingId]: true })); 

            await withdraw.mutateAsync({
                bookingId: bookingId,
                guestPk: guestPk
            });
            
            const ixItem = bookings.findIndex((i: BookingRecord) => 
                i.bookingId == bookingId && i.guestPk == guestPk && i.hostPk == publicKey?.toBase58());
            
            if (ixItem > -1) {

                const updatedBookings = [...bookings];
                updatedBookings.splice(ixItem, 1);
                setBookings(updatedBookings);
                toast.success('Withdrawal successful!');
            }
            
        } catch (err: any) {
            console.log('Withdraw failed: ', err);
        } finally {
            setIsLoading((prev) => ({ ...prev, [bookingId]: false })); 
          }
    }


    return (
        <div className="flex flex-col items-center space-y-4 p-4">
          <h2 className="text-lg font-semibold text-center">Payments from Guests</h2>
    
          {publicKey ? (
            bookings.filter((b: BookingRecord) => b.hostPk === publicKey.toString()).length === 0 ? (
              <p className="text-gray-500 text-center">No pending payments found.</p>
            ) : (
              bookings
                .filter((b: BookingRecord) => b.hostPk === publicKey.toString())
                .map((booking: BookingRecord) => (
                  <div
                    key={booking.bookingId}
                    className="border p-4 rounded-lg shadow-md bg-gray-50 w-[800px] max-w-full"
                  >
                    <h3 className="font-semibold text-violet-600">Booking ID</h3>
                    <p className="text-sm text-gray-700 break-all">{booking.bookingId}</p>
    
                    <h3 className="font-semibold text-violet-600 mt-2">Host</h3>
                    <p className="text-sm text-gray-700 break-all">{booking.hostPk}</p>
    
                    <h3 className="font-semibold text-violet-600 mt-2">Guest</h3>
                    <p className="text-sm text-gray-700 break-all">{booking.guestPk}</p>
    
                    <h3 className="font-semibold text-violet-600 mt-2">Amount</h3>
                    <p className="text-sm text-gray-700">{booking.amount} SOL</p>
    
                    <h3 className="font-semibold text-violet-600 mt-2">Check-In</h3>
                    <p className="text-sm text-gray-700">
                      {new Date(booking.checkInTimestamp * 1000).toLocaleString()}
                    </p>
    
                    <h3 className="font-semibold text-violet-600 mt-2">Check-Out</h3>
                    <p className="text-sm text-gray-700">
                      {new Date(booking.checkOutTimestamp * 1000).toLocaleString()}
                    </p>
    
                    <h3 className="font-semibold text-violet-600 mt-2">Transaction</h3>
                    <p className="text-sm text-gray-700 break-all">{booking.txSignature}</p>
    
                    {/* Withdraw Button or Spinner */}
                    <div className="mt-4 flex justify-end">
                      {isLoading[booking.bookingId] ? (
                        <div className="flex items-center justify-center">
                          <svg
                            className="animate-spin h-6 w-6 text-violet-600"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        </div>
                      ) : (
                        <button
                          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
                          onClick={() => handleWithdraw(booking.bookingId, booking.guestPk)}
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                ))
            )
          ) : (
            <WalletButton style={{ width: '100%' }} className="w-full" />
          )}
        </div>
      );
}

