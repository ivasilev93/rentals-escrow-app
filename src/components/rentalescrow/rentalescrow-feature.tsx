import { useWallet } from '@solana/wallet-adapter-react'
import { useRentalescrowProgram, getPropertyData, fetchSolPrice } from './rentalescrow-data-access'
import { RentalUI } from './rentalescrow-ui'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast';


export default function RentalescrowFeature() {
    const { book } = useRentalescrowProgram();
    const { publicKey } = useWallet();
    const propertyData = getPropertyData();

    const startDate = new Date();
    startDate.setMinutes(startDate.getMinutes() + 1); //1 mins from now
    const endDate: Date = new Date(startDate);
    endDate.setMinutes(startDate.getMinutes() + 2); //3 mins from now

  const [confirmationOpen, setConfirmation] = useState(false);
  const [usdAmountInLamports, setUsdAmountInLamports] = useState<number>(0);
  const [txSignature, setTxSignature] = useState<string>("");
  const [bookingId, setBookingId] = useState<string>("");
  const [hostPk, setHostPk] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false); 

    // Fetch SOL price and calculate lamports on mount
    useEffect(() => {
        const calculateLamports = async () => {
            try {
                const solPrice = await fetchSolPrice();
                if (!solPrice) {
                    throw new Error("Couldn't fetch SOL price");
                }
                const solPerNight = propertyData.pricePerNight / solPrice;
                const lamports = Math.floor(solPerNight * LAMPORTS_PER_SOL);
                setUsdAmountInLamports(lamports);
            } catch (error) {
                console.error("Error calculating lamports:", error);
                toast.error('Failed to fetch SOL price');
            }
        };
        calculateLamports();
    }, [propertyData.pricePerNight]);

    const handleBooking = async (hostPk: string) => {
       try {
        if (!publicKey) {
            toast.error("Please connect your wallet first");
        }

        setIsLoading(true);

        const guid = crypto.randomUUID().replace(/-/g, '');
        //convert dates into unix timestamp
        const checkInUnixStmap = Math.floor(startDate.getTime() / 1000);
        const checOutnUnixStmap = Math.floor(endDate.getTime() / 1000);

        const transactionSignature = await book.mutateAsync({
          bookingId: guid,
          checkInTimestamp: checkInUnixStmap,
          checkOutTimestamp: checOutnUnixStmap,
          usdAmountInLamports: usdAmountInLamports,
          hostPk: hostPk
        });
        setTxSignature(transactionSignature);
        setBookingId(guid);
        setHostPk(hostPk);
        setConfirmation(true);
       } catch(err: any)  {
        console.error('*Booking error:', err);
      } finally {
        setIsLoading(false); 
      }
    }

    return (
        <>
          <RentalUI 
              property={propertyData}
              startDate={startDate}
              endDate={endDate}
              onBookProperty={handleBooking}
              publicKey={!!publicKey}
              isLoading={isLoading}
          />

          {confirmationOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-5/6 max-w-xl">
                        <h2 className="text-lg font-semibold">Transaction details</h2>
                        <div className="space-y-2 mt-6">
                          <div>
                              <span className="font-semibold">Transaction:</span>
                              <div className="text-sm text-gray-600 mt-1 p-2 bg-gray-100 rounded-md break-all overflow-x-auto">
                                  {txSignature}
                              </div>
                          </div>

                          <div>
                              <span className="font-semibold">Booking ID:</span>
                              <div className="text-sm text-gray-600 mt-1 p-2 bg-gray-100 rounded-md">
                                  {bookingId}
                              </div>
                          </div>

                          <div>
                              <span className="font-semibold">Host:</span>
                              <div className="text-sm text-gray-600 mt-1 p-2 bg-gray-100 rounded-md">
                                  {hostPk}
                              </div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button className="px-4 py-2 bg-violet-600 text-white rounded-lg" onClick={() => setConfirmation(false)}>
                              OK
                          </button>
                        </div>
                    </div>
                </div>
          )}
        </>
    )
}
