'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to account page after 5 seconds
    const timer = setTimeout(() => {
      router.push('/account');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="pt-20 px-8 py-12 flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
            <p className="text-xl text-gray-400 mb-8">
              Your subscription has been activated successfully.
            </p>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-6 mb-8">
            <p className="text-gray-300 mb-4">
              You now have access to all premium features and content.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to your account in 5 seconds...
            </p>
          </div>

          <button
            onClick={() => router.push('/account')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Go to Account
          </button>
        </div>
      </div>
    </div>
  );
}
