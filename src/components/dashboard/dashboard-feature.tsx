import { useState } from "react";
import { Link } from "react-router-dom";

export default function DashboardFeature() {
  const [bookings, setBookings] = useState<[]>(() => {
          return JSON.parse(localStorage.getItem("bookings") || "[]");
      });

  function clearStorage(): void {
    localStorage.removeItem("bookings"); 
    setBookings([]);
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">A sample escrow implementation for rental payments settlement</h1>
      <p className="text-lg text-gray-600 mb-6">
        This is a mock app that uses simple decentralized payments escrow contract built on Solana. Here’s how it works:
      </p>
      <ol className="list-decimal list-inside space-y-4 text-gray-700">
        <li>
          <span className="font-semibold"><Link className="underline" to={'/book'}>Book a Stay:</Link></span> Go to book page. Checkin and checkout will be fixed for easier testing purposes (checkin - 1 min from now, checkout - 2 mins from now). You will have to set a host public key (try another wallet address you control), and pay with wSOL (ATA is automatically created and synced, if you dont have wSOL tokens). Your payment gets locked in the escrow smart contract and host can withdraw it after the end date.
        </li>
        <li>
          <span className="font-semibold">Save Your Booking:</span> After booking, you’ll get a transaction signature and a unique 32-character booking ID. The app will store the transaciton data in your browser's local storage for easier testing. You can delete them anytime. Obviously in production setting a web app will manage those.
        </li>
        <li>
          <span className="font-semibold"><Link className="underline" to={'/host-withdraw'}>Withdraw as a Host:</Link></span> Once the "stay" ends, switch to your host wallet, enter the booking ID and guest public key, and withdraw your payment from the escrow.
        </li>
        <li>
          <span className="font-semibold">Clear the records:</span> Click the button below to clear your browser's local storage in case any records have gotten stale. </li>
      </ol>
      <button
        className={`w-full bg-red-400 text-white py-3 px-6 rounded-lg font-bold transition mt-8 ${
          bookings.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-red-700"
        }`}
        onClick={() => clearStorage()}
        disabled={bookings.length === 0}
      >
        Clear local storage
      </button>   
      
    </div>
  );
}