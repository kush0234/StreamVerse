'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [maxProfiles, setMaxProfiles] = useState(2);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [suggestedPlans, setSuggestedPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [maturityLevel, setMaturityLevel] = useState('ADULT');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const [data, userInfo, plans] = await Promise.all([
        api.getProfiles(token),
        api.getUserInfo(token).catch(() => null),
        api.getSubscriptionPlans().catch(() => []),
      ]);
      setProfiles(data);
      if (userInfo?.max_profiles) setMaxProfiles(userInfo.max_profiles);
      setHasSubscription(!!userInfo?.subscription_info);
      setSuggestedPlans(Array.isArray(plans) ? plans.slice(0, 3) : []);
    } catch (err) {
      console.error('Failed to load profiles', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');

    try {
      await api.createProfile(token, newProfileName, profileImage, maturityLevel);
      setNewProfileName('');
      setProfileImage(null);
      setImagePreview(null);
      setMaturityLevel('ADULT');
      setShowCreateForm(false);
      loadProfiles();
    } catch (err) {
      console.error('Failed to create profile', err);
      alert(err.message || 'Failed to create profile');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const selectProfile = (profile) => {
    localStorage.setItem('selected_profile', JSON.stringify(profile));
    router.push('/browse');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-black to-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-black text-white">
      {/* Header */}
      <div className="fixed top-0 w-full z-50 px-4 sm:px-8 py-4 sm:py-6 glass-effect">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <img
            src="/logo.png"
            alt="StreamVerse Logo"
            className="h-8 md:h-10 hover:scale-105 transition-transform cursor-pointer"
            onClick={() => router.push('/browse')}
          />
          <button
            onClick={() => {
              localStorage.clear();
              router.push('/login');
            }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="pt-28 sm:pt-32 pb-20 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 sm:mb-12 text-center animate-fade-in">
            Who's Watching?
          </h1>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 sm:gap-6 md:gap-8 mb-12">
            {profiles.map((profile, index) => (
              <div
                key={profile.id}
                onClick={() => selectProfile(profile)}
                className="flex flex-col items-center cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative mb-3 md:mb-4">
                  {profile.profile_image_url ? (
                    <img
                      src={profile.profile_image_url}
                      alt={profile.name}
                      className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-transparent group-hover:border-white transition-all duration-300 shadow-2xl"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl sm:text-4xl md:text-5xl font-bold border-4 border-transparent group-hover:border-white transition-all duration-300 shadow-2xl group-hover:scale-110">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <span className="text-sm sm:text-base md:text-lg font-medium text-gray-400 group-hover:text-white transition-colors text-center truncate w-full text-center">
                  {profile.name}
                </span>
              </div>
            ))}

            {/* Add Profile Button */}
            {profiles.length < maxProfiles ? (
              <div
                onClick={() => setShowCreateForm(true)}
                className="flex flex-col items-center cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${profiles.length * 100}ms` }}
              >
                <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center border-4 border-gray-700 group-hover:border-white transition-all duration-300 mb-3 md:mb-4 group-hover:scale-110">
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-gray-700 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm sm:text-base md:text-lg font-medium text-gray-400 group-hover:text-white transition-colors">
                  Add Profile
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center opacity-40 cursor-not-allowed animate-fade-in">
                <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center border-4 border-gray-800 mb-3 md:mb-4">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-600 text-center">
                  Limit reached
                  <br />
                  <span className="text-xs">Upgrade plan for more</span>
                </span>
              </div>
            )}
          </div>

          <div className="text-center">
            {profiles.length < maxProfiles ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-8 py-3 border-2 border-gray-600 hover:border-white text-gray-400 hover:text-white rounded transition-all duration-300 font-medium"
              >
                Manage Profiles
              </button>
            ) : (
              <button
                onClick={() => router.push('/plans')}
                className="px-8 py-3 border-2 border-yellow-600 hover:border-yellow-400 text-yellow-500 hover:text-yellow-300 rounded transition-all duration-300 font-medium"
              >
                Upgrade Plan for More Profiles
              </button>
            )}
          </div>

          {/* Upgrade Banner — shown when at limit with no subscription */}
          {profiles.length >= maxProfiles && !hasSubscription && suggestedPlans.length > 0 && (
            <div className="mt-12 max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Free plan limit reached</p>
                <h2 className="text-2xl font-bold">Want more profiles?</h2>
                <p className="text-gray-400 mt-1">Upgrade to a paid plan and add up to 6 profiles.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {suggestedPlans.map((plan) => {
                  const isPopular = plan.name === 'STANDARD';
                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-xl p-6 border-2 transition-all hover:scale-105 cursor-pointer ${isPopular
                        ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/20'
                        : 'border-gray-700 bg-gray-900/50 hover:border-gray-500'
                        }`}
                      onClick={() => router.push('/plans')}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-blue-600 text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                        </div>
                      )}
                      <div className="text-center">
                        <h3 className="font-bold text-lg mb-1">{plan.display_name}</h3>
                        <p className="text-2xl font-bold mb-1">₹{plan.monthly_price}<span className="text-sm text-gray-400">/mo</span></p>
                        <p className="text-xs text-gray-400 mb-4">Up to {plan.max_profiles} profiles</p>
                        <ul className="text-sm text-gray-300 space-y-1 text-left mb-4">
                          <li>✓ {plan.max_profiles} profiles</li>
                          <li>✓ {plan.video_quality} quality</li>
                          <li>✓ {plan.max_simultaneous_streams} simultaneous stream{plan.max_simultaneous_streams > 1 ? 's' : ''}</li>
                          {!plan.has_ads && <li>✓ Ad-free</li>}
                          {plan.can_download && <li>✓ Downloads</li>}
                        </ul>
                        <button className={`w-full py-2 rounded-lg text-sm font-semibold transition ${isPopular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
                          }`}>
                          Choose {plan.display_name}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Profile Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gradient-to-b from-gray-900 to-black p-6 sm:p-8 rounded-2xl w-full max-w-md mx-4 border border-gray-800 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6">Add Profile</h2>
            <p className="text-gray-400 mb-6">Add a profile for another person watching StreamVerse.</p>

            <form onSubmit={handleCreateProfile}>
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Name"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full p-4 bg-gray-800 text-white rounded-lg border-2 border-gray-700 focus:outline-none focus:border-white transition-colors"
                  required
                  autoFocus
                />
              </div>

              {/* Profile Image Upload */}
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">Profile Image <span className="text-gray-600">(optional)</span></label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-800 border-2 border-gray-700 flex items-center justify-center flex-shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer">
                    <div className="w-full p-3 bg-gray-800 text-gray-400 rounded-lg border-2 border-dashed border-gray-700 hover:border-white hover:text-white transition-colors text-center text-sm">
                      {profileImage ? profileImage.name : 'Click to upload image'}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Maturity Level Toggle */}
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-3">Maturity Level</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setMaturityLevel('ADULT')}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${maturityLevel === 'ADULT'
                      ? 'bg-white text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                  >
                    🎬 Adult
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaturityLevel('KIDS')}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${maturityLevel === 'KIDS'
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                  >
                    🧒 Kids
                  </button>
                </div>
                {maturityLevel === 'KIDS' && (
                  <p className="text-xs text-yellow-400 mt-2">Kids profiles only show age-appropriate content.</p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewProfileName('');
                    setProfileImage(null);
                    setImagePreview(null);
                    setMaturityLevel('ADULT');
                  }}
                  className="flex-1 bg-transparent border-2 border-gray-600 text-gray-400 hover:border-white hover:text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
