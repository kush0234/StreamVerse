'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

        <div className="relative bg-black/70 backdrop-blur-xl p-12 rounded-2xl w-full max-w-md border border-gray-800 shadow-2xl text-center">
          <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">Check Your Email</h1>
          <p className="text-gray-400 mb-8">
            We've sent a password reset link to <span className="text-blue-400 font-semibold">{email}</span>
          </p>

          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-300">
              💡 The link will expire in 1 hour. If you don't see the email, check your spam folder.
            </p>
          </div>

          <Link
            href="/login"
            className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-lg transition-all shadow-lg shadow-blue-500/20"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

      <div className="relative bg-black/70 backdrop-blur-xl p-12 rounded-2xl w-full max-w-md border border-gray-800 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="StreamVerse Logo"
              className="h-16 md:h-20 hover:scale-105 transition-transform"
            />
          </div>
          <p className="text-gray-400">Reset your password</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-gray-900/50 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all shadow-lg shadow-blue-500/20 mt-6"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </span>
            ) : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
