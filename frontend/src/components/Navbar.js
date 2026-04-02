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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const selectedProfile = localStorage.getItem('selected_profile');
    if (selectedProfile) {
      setProfile(JSON.parse(selectedProfile));
    }
    const role = localStorage.getItem('role');
    setIsAdmin(role === 'ADMIN');
    loadSubscription();
    const handleScroll = () => setScrolled(window.scrollY > 50);
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
    const icons = { 'BASIC': '🥉', 'STANDARD': '🥈', 'PREMIUM': '🥇' };
    return icons[planName] || '📦';
  };

  const handleLogout = () => { localStorage.clear(); router.push('/login'); };
  const handleProfileChange = () => router.push('/profiles');
  const handleAccountClick = () => router.push('/account');

  const navLinks = [
    { label: 'Home', path: '/browse' },
    { label: 'Movies', path: '/movies' },
    { label: 'Music', path: '/music' },
    { label: 'My List', path: '/watchlist' },
    { label: 'Feedback', path: '/feedback' },
    { label: 'Plans', path: '/plans' },
    { label: 'Account', path: '/account' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-black">
      <div className="px-4 md:px-8 py-3">
        <div className="flex items-center justify-between max-w-[2000px] mx-auto gap-4">
          {/* Left - Logo & desktop nav */}
          <div className="flex items-center gap-4 md:gap-8 flex-1 min-w-0">
            <img
              src="/logo.png"
              alt="StreamVerse Logo"
              className="h-8 md:h-10 cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
              onClick={() => router.push('/browse')}
            />
            <div className="hidden lg:flex gap-4 xl:gap-6 text-sm font-medium">
              {navLinks.map(({ label, path }) => (
                <button key={path} onClick={() => router.push(path)} className="hover:text-white text-gray-300 transition-colors whitespace-nowrap">
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Right - Search, badge, profile, hamburger */}
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
            <SearchBar />

            {subscription && subscription.is_active_status && (
              <div
                onClick={() => router.push('/plans')}
                className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${getPlanBadgeColor(subscription.plan_details?.name)} cursor-pointer hover:scale-105 transition-transform shadow-lg whitespace-nowrap`}
              >
                <span className="text-base">{getPlanIcon(subscription.plan_details?.name)}</span>
                <span className="text-xs font-semibold">{subscription.plan_details?.display_name}</span>
              </div>
            )}

            {/* Profile avatar with dropdown - desktop only */}
            {profile && (
              <div className="relative group flex-shrink-0 hidden lg:block">
                <div
                  onClick={handleAccountClick}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden cursor-pointer hover:ring-4 ring-white/30 transition-all hover:scale-110 shadow-lg"
                >
                  {profile.profile_image_url ? (
                    <img src={profile.profile_image_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute right-0 mt-2 w-56 bg-black backdrop-blur-lg rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-800">
                  {subscription && subscription.is_active_status && (
                    <div className="px-4 py-3 border-b border-gray-800">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getPlanIcon(subscription.plan_details?.name)}</span>
                        <span className="text-sm font-semibold">{subscription.plan_details?.display_name}</span>
                      </div>
                      <p className="text-xs text-gray-400">{subscription.days_left} days remaining</p>
                    </div>
                  )}
                  <button onClick={handleAccountClick} className="w-full text-left px-4 py-3 hover:bg-gray-800/80 transition-colors text-sm">⚙️ Account Settings</button>
                  {isAdmin && (
                    <button onClick={() => router.push('/admin-dashboard')} className="w-full text-left px-4 py-3 hover:bg-gray-800/80 transition-colors text-sm text-red-400 font-semibold">🛡️ Admin Panel</button>
                  )}
                  <button onClick={() => router.push('/plans')} className="w-full text-left px-4 py-3 hover:bg-gray-800/80 transition-colors text-sm">💳 Subscription Plans</button>
                  <button onClick={() => router.push('/feedback/my-feedback')} className="w-full text-left px-4 py-3 hover:bg-gray-800/80 transition-colors text-sm">💬 My Feedback</button>
                  <button onClick={handleProfileChange} className="w-full text-left px-4 py-3 hover:bg-gray-800/80 transition-colors text-sm">👤 Switch Profile</button>
                  <div className="border-t border-gray-800"></div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-gray-800/80 transition-colors text-sm text-red-400 rounded-b-lg">🚪 Logout</button>
                </div>
              </div>
            )}

            {/* Hamburger - mobile/tablet */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-black/95 backdrop-blur-lg border-t border-gray-800 px-4 py-4">
          {profile && (
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-800">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {profile.profile_image_url ? (
                  <img src={profile.profile_image_url} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">{profile.name}</p>
                {subscription && subscription.is_active_status && (
                  <p className="text-xs text-gray-400">{subscription.plan_details?.display_name} · {subscription.days_left}d left</p>
                )}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1">
            {navLinks.map(({ label, path }) => (
              <button
                key={path}
                onClick={() => { router.push(path); setMobileMenuOpen(false); }}
                className="text-left px-3 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
              >
                {label}
              </button>
            ))}
            {isAdmin && (
              <button
                onClick={() => { router.push('/admin-dashboard'); setMobileMenuOpen(false); }}
                className="text-left px-3 py-3 text-red-400 hover:bg-white/10 rounded-lg transition-colors text-sm font-semibold"
              >
                �️ Admin Panel
              </button>
            )}
            <div className="border-t border-gray-800 mt-2 pt-2">
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="text-left px-3 py-3 text-red-400 hover:bg-white/10 rounded-lg transition-colors text-sm font-medium w-full"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
