
import { useState } from 'react'
import { PropertyData } from './rentalescrow-data-access'
import { WalletButton } from '../solana/solana-provider'

interface RentalBookingUIProps {
  property: PropertyData;
  startDate: Date | null;
  endDate: Date | null;
  onBookProperty: (hotsPk:string) => Promise<void>;
  publicKey: boolean;
  isLoading: boolean; 
}

type InputDialogProps = {
  onClose: (value: string | null) => void;
};

type BookParams = {
  startDate: Date | null;
  endDate: Date | null;
  onBookProperty: (hotsPk:string) => Promise<void>;
  // hostPk: string ... In prod setting this should be hadled by backend app...
}

function BookButton(params: BookParams) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleBooking = async (hostPk: string) => {
    console.log('in handleBooking: ', hostPk);

    if (hostPk) {
        await params.onBookProperty(hostPk);
    }
  }

  return (
  <>
    <button 
      className="w-full bg-violet-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-violet-700 transition"
      onClick={() => setDialogOpen(true)}
      >
      Book Now
    </button>

    {dialogOpen && (
      <HostPublicKeyPrompt onClose={(value) => {
        setDialogOpen(false);
        if (value) { handleBooking(value); }
      }} />
    )}
  </>
  );
}


function HostPublicKeyPrompt({ onClose } : InputDialogProps) {
  const [value, setValue] = useState("");

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-5/6 max-w-xl">
        <h2 className="text-lg font-semibold"> Set a public key that can withdraw the booking payment</h2>
        <p className="text-sm text-red-600 mt-1">This is to make testing easier. In prod setting this should be hadled by backend app...</p>
        <input
          type="text"
          className="w-full p-2 border rounded-lg mt-3 focus:ring focus:ring-blue-300"
          placeholder="Host public key..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="mt-4 flex justify-end space-x-2">
          <button className="px-4 py-2 bg-gray-300 rounded-lg" onClick={() => onClose(null)}>Cancel</button>
          <button className="px-4 py-2 bg-violet-600 text-white rounded-lg" onClick={() => onClose(value)}>OK</button>
        </div>
      </div>
    </div>
  );
}

export function RentalUI({
  property,
  startDate,
  endDate,
  onBookProperty,
  publicKey,
  isLoading,
  // error,
}: RentalBookingUIProps) {
  return (
    <>
    <div className="max-w-6xl mx-auto p-4 font-sans">
      {/* Property header */}
      <div className="bg-white shadow-md p-4 flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">{property.name}</h1>
          <p className="text-gray-600">{property.location}</p>
        </div>
        <div className="font-bold text-xl">${property.pricePerNight} <span className="text-sm font-normal">night</span></div>
      </div>

       {/* Image Gallery */}
       <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 relative">
          <div className="md:col-span-2 md:row-span-2">
            <img src={property.images[0]} alt="Main view" className="w-full h-full object-cover rounded-l-lg" />
          </div>
          {property.images.slice(1).map((img, index) => (
            <div key={index} className="hidden md:block">
              <img src={img} alt={`View ${index + 2}`} className="w-full h-full object-cover rounded-r-lg" />
            </div>
          ))}
          
          {/* Mobile "+" button overlay */}
          <button className="absolute bottom-4 right-4 bg-white bg-opacity-70 rounded-full p-2 md:hidden">
            <span className="text-lg font-bold">+{property.images.length - 1}</span>
          </button>
        </div>
      </div>

       {/* Content Section */}
       <div className="flex flex-col md:flex-row gap-6">
        {/* Left Panel: Description and Host Info */}
        <div className="w-full md:w-7/12">
          {/* Host Info */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div>
              <h2 className="text-xl font-bold">Entire villa hosted by {property.host.name}</h2>
              <p className="text-gray-600">Hosting since {property.host.hostSince}</p>
            </div>
            <img src={property.host.profilePic} alt={property.host.name} className="rounded-full w-20 h-20" />
          </div>
          
          {/* Property Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">About this place</h3>
            <p className="text-gray-700">{property.description}</p>
          </div>
        </div>

        {/* Right Panel: Booking Form */}
        <div className="w-full md:w-5/12">
          <div className="border rounded-xl p-6 shadow-lg sticky top-24">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold">${property.pricePerNight} <span className="text-sm font-normal">night</span></span>
              <div className="text-sm text-gray-600">★ 4.92 · 128 reviews</div>
            </div>

            {/* Calendar Mock */}
            <div className="border rounded-lg mb-4">
              <p className="p-2 text-red-500 text-l">For easier testing, dates will be fixed 1 min apart</p>
              <div className="flex border-b">
                <div className="w-1/2 p-4 border-r">
                  <div className="text-xs font-bold text-gray-500">CHECK-IN</div>
                  <div> {startDate?.toLocaleString()} </div>
                </div>
                <div className="w-1/2 p-4">
                  <div className="text-xs font-bold text-gray-500">CHECKOUT</div>
                  <div> {endDate?.toLocaleString()} </div>
                </div>
              </div>
              <div className="p-4 border-b">
                <div className="text-xs font-bold text-gray-500">GUESTS</div>
                <div>2 guests</div>
              </div>
            </div>

            {/* Book Button */}
            {publicKey ? (
              isLoading ? (
                <div className="w-full flex justify-center items-center py-3">
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
                <BookButton startDate={startDate} endDate={endDate} onBookProperty={onBookProperty} />
              )
            ) : (
              <WalletButton style={{ width: '100%' }} className="w-full" />
            )}

            {/* Price */}
            <div className="mt-4">
              <div className="flex justify-between py-2">
                <span className="underline"> ${property.pricePerNight} x 1 night</span>
                <span>${property.pricePerNight * 1}</span>
              </div>
              {/* <div className="flex justify-between py-2">
                <span className="underline">Solana Network Fee</span>
                <span>$1.25</span>
              </div> */}
              <div className="flex justify-between py-2 border-t mt-2 pt-2 font-bold">
                <span>Total (USD)</span>
                <span>${property.pricePerNight * 1}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
    </>
  )
}