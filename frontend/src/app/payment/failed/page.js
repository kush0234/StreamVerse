'use client';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function PaymentFailedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="pt-20 px-8 py-12 flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4">Payment Failed</h1>
            <p className="text-xl text-gray-400 mb-8">
              We couldn't process your payment. Please try again.
            </p>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold mb-3">Common reasons for payment failure:</h3>
            <ul className="text-left text-sm text-gray-400 space-y-2">
              <li>• Insufficient funds in your account</li>
              <li>• Incorrect card details</li>
              <li>• Card expired or blocked</li>
              <li>• Network connectivity issues</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/plans')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/browse')}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition"
            >
              Back to Browse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
