'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import SearchBar from './SearchBar';
import { api } from '@/lib/api';

export default function Navbar() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const selectedProfile = localStorage.getItem('selected_profile');
    if (selectedProfile) {
      setProfile(JSON.parse(selectedProfile));
    }

    // Check if user is admin
    const role = localStorage.getItem('role');
    setIsAdmin(role === 'ADMIN');

    loadSubscription();

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadSubscription = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const subData = await api.getUserSubscription(token);
        setSubscription(subData);
      } catch (error) {
        console.error('Failed to load subscription:', error);
      }
    }
  };

  const getPlanBadgeColor = (planName) => {
    const colors = {
      'BASIC': 'from-gray-500 to-gray-600',
      'STANDARD': 'from-blue-500 to-blue-600',
      'PREMIUM': 'from-purple-500 to-pink-600',
    };
    return colors[planName] || 'from-gray-500 to-gray-600';
  };

  const getPlanIcon = (planName) => {
    const icons = {
      'BASIC': '🥉',
      'STANDARD': '🥈',
      'PREMIUM': '🥇',
    };
    return icons[planName] || '📦';
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const handleProfileChange = () => {
    router.push('/profiles');
  };

  const handleAccountClick = () => {
    router.push('/account');
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 bg-black`}>
      <div className="px-4 md:px-8 py-3">
        <div className="flex items-center justify-between max-w-[2000px] mx-auto gap-4">
          {/* Left Section - Logo & Nav Links */}
          <div className="flex items-center gap-4 md:gap-8 flex-1 min-w-0">
            <img
              src="/logo.png"
              alt="StreamVerse Logo"
              className="h-8 md:h-10 cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
              onClick={() => router.push('/browse')}
            />
            <div className="hidden lg:flex gap-4 xl:gap-6 text-sm font-medium">
              <button onClick={() => router.push('/browse')} className="hover:text-white text-gray-300 transition-colors whitespace-nowrap">
                Home
              </button>
              <button onClick={() => router.push('/movies')} className="hover:text-white text-gray-300 transition-colors whitespace-nowrap">
                Movies
              </button>
              <button onClick={() => router.push('/music')} className="hover:text-white text-gray-300 transition-colors whitespace-nowrap">
                Music
              </button>
              <button onClick={() => router.push('/watchlist')} className="hover:text-white text-gray-300 transition-colors whitespace-nowrap">
                My List
              </button>
              <button onClick={() => router.push('/feedback')} className="hover:text-white text-gray-300 transition-colors whitespace-nowrap">
                Feedback
              </button>
              <button onClick={() => router.push('/plans')} className="hover:text-white text-gray-300 transition-colors whitespace-nowrap">
                Plans
              </button>
              <button onClick={() => router.push('/account')} className="hover:text-white text-gray-300 transition-colors whitespace-nowrap">
                Account
              </button>
            </div>
          </div>

          {/* Right Section - Search, Badge & Profile */}
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
            <SearchBar />

            {/* Subscription Badge */}
            {subscription && subscription.is_active_status && (
              <div
                onClick={() => router.push('/plans')}
                className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${getPlanBadgeColor(subscription.plan_details?.name)} cursor-pointer hover:scale-105 transition-transform shadow-lg whitespace-nowrap`}
                title="Click to view plans"
              >
                <span className="text-base">{getPlanIcon(subscription.plan_details?.name)}</span>
                <span className="text-xs font-semibold">{subscription.plan_details?.display_name}</span>
              </div>
            )}

            {profile && (
              <div className="relative group flex-shrink-0">
                <div
                  onClick={handleAccountClick}
                  className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer hover:ring-4 ring-white/30 transition-all hover:scale-110 shadow-lg"
                >
                  {profile.name.charAt(0).toUpperCase()}
                </div>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-56 bg-black backdrop-blur-lg rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-800">
                  {/* Subscription Info in Dropdown */}
                  {subscription && subscription.is_active_status && (
                    <div className="px-4 py-3 border-b border-gray-800">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getPlanIcon(subscription.plan_details?.name)}</span>
                        <span className="text-sm font-semibold">{subscription.plan_details?.display_name}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {subscription.days_left} days remaining
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleAccountClick}
                    className="w-full text-left px-4 py-3 hover:bg-gray-800/80 transition-colors text-sm"
                  >
                    ⚙️ Account Settings
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => router.push('/admin-dashboard')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-800/80 transition-colors text-sm text-red-400 font-semibold"
                    >
                      🛡️ Admin Panel
                    </button>
                  )}
                  <button
                    onClick={() => router.push('/plans')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-800/80 transition-colors text-sm"
                  >
                    💳 Subscription Plans
                  </button>
                  <button
                    onClick={() => router.push('/feedback/my-feedback')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-800/80 transition-colors text-sm"
                  >
                    💬 My Feedback
                  </button>
                  <button
                    onClick={handleProfileChange}
                    className="w-full text-left px-4 py-3 hover:bg-gray-800/80 transition-colors text-sm"
                  >
                    👤 Switch Profile
                  </button>
                  <div className="border-t border-gray-800"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 hover:bg-gray-800/80 transition-colors text-sm text-red-400 rounded-b-lg"
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
