'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function AccountPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('profile');
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Profile Management
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [maturityLevel, setMaturityLevel] = useState('ADULT');

  // Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete Account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Subscription
  const [subscription, setSubscription] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [suggestedPlans, setSuggestedPlans] = useState([]);

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const [profilesData, userInfo, subscriptionData, paymentsData, plansData] = await Promise.all([
        api.getProfiles(token),
        api.getUserInfo(token),
        api.getUserSubscription(token).catch(() => null),
        api.getPaymentHistory(token).catch(() => []),
        api.getSubscriptionPlans().catch(() => []),
      ]);
      setProfiles(profilesData);
      setUser(userInfo);
      setSubscription(subscriptionData);
      setPaymentHistory(paymentsData);
      setSuggestedPlans(Array.isArray(plansData) ? plansData.slice(0, 3) : []);
    } catch (err) {
      console.error('Failed to load account data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProfile = async () => {
    if (!newProfileName.trim()) {
      alert('Please enter a profile name');
      return;
    }


    const token = localStorage.getItem('access_token');
    try {
      await api.createProfile(token, newProfileName, profileImage, maturityLevel);
      setNewProfileName('');
      setProfileImage(null);
      setImagePreview(null);
      setMaturityLevel('ADULT');
      setShowAddProfile(false);
      loadAccountData();
    } catch (err) {
      console.error('Failed to create profile', err);
      alert('Failed to create profile');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEditProfile = (profile) => {
    setEditingProfile(profile);
    setNewProfileName(profile.name);
    setImagePreview(profile.profile_image_url || null);
    setProfileImage(null);
    setMaturityLevel(profile.maturity_level || 'ADULT');
    setShowEditProfile(true);
  };

  const handleUpdateProfile = async () => {
    if (!newProfileName.trim()) {
      alert('Please enter a profile name');
      return;
    }

    const token = localStorage.getItem('access_token');
    try {
      await api.updateProfile(token, editingProfile.id, newProfileName, profileImage, maturityLevel);
      setNewProfileName('');
      setProfileImage(null);
      setImagePreview(null);
      setMaturityLevel('ADULT');
      setShowEditProfile(false);
      setEditingProfile(null);
      loadAccountData();
    } catch (err) {
      console.error('Failed to update profile', err);
      alert(`Failed to update profile: ${err.message}`);
    }
  };

  const handleDeleteProfile = async (profile) => {
    if (profiles.length === 1) {
      alert('You must have at least one profile');
      return;
    }

    if (confirm(`Are you sure you want to delete the profile "${profile.name}"?`)) {
      const token = localStorage.getItem('access_token');
      try {
        await api.deleteProfile(token, profile.id);
        loadAccountData();

        // If deleted profile was selected, clear it
        const selectedProfile = localStorage.getItem('selected_profile');
        if (selectedProfile) {
          const selected = JSON.parse(selectedProfile);
          if (selected.id === profile.id) {
            localStorage.removeItem('selected_profile');
          }
        }
      } catch (err) {
        console.error('Failed to delete profile', err);
        alert('Failed to delete profile');
      }
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    const token = localStorage.getItem('access_token');
    try {
      await api.changePassword(token, currentPassword, newPassword);
      alert('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Failed to change password', err);
      alert(`Failed to change password: ${err.message}`);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    const token = localStorage.getItem('access_token');
    try {
      await api.deleteAccount(token);
      localStorage.clear();
      router.push('/register');
    } catch (err) {
      console.error('Failed to delete account', err);
      alert(`Failed to delete account: ${err.message}`);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('selected_profile');
    router.push('/login');
  };

  const sections = [
    { id: 'profile', name: 'Profile Management', icon: '👤' },
    { id: 'account', name: 'Account Information', icon: '📋' },
    { id: 'security', name: 'Privacy & Security', icon: '🔒' },
    { id: 'billing', name: 'Subscription & Billing', icon: '💳' },
    { id: 'help', name: 'Help & Support', icon: '❓' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20 px-8 py-12 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="pt-20 px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-3">Account Settings</h1>
          <p className="text-gray-400 text-lg">Manage your account and preferences</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-gray-900/50 rounded-xl p-4 sticky top-24">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition flex items-center gap-3 ${activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                >
                  <span className="text-xl">{section.icon}</span>
                  <span className="font-medium">{section.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-gray-900/30 rounded-xl p-8">

              {/* Profile Management */}
              {activeSection === 'profile' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6">Profile Management</h2>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
                    {profiles.map((profile) => (
                      <div
                        key={profile.id}
                        className="bg-gray-800/50 rounded-lg p-6 text-center hover:bg-gray-700/50 transition group relative"
                      >
                        <div
                          className="cursor-pointer"
                          onClick={() => {
                            localStorage.setItem('selected_profile', JSON.stringify(profile));
                            router.push('/browse');
                          }}
                        >
                          <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden border-2 border-transparent group-hover:border-blue-500 transition">
                            {profile.profile_image_url ? (
                              <img src={profile.profile_image_url} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold">
                                {profile.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold mb-1">{profile.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${profile.maturity_level === 'KIDS'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-700 text-gray-400'
                            }`}>
                            {profile.maturity_level === 'KIDS' ? '🧒 Kids' : '🎬 Adult'}
                          </span>
                        </div>

                        {/* Edit/Delete buttons */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProfile(profile);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full transition"
                            title="Edit Profile"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProfile(profile);
                            }}
                            className="bg-red-600 hover:bg-red-700 p-2 rounded-full transition"
                            title="Delete Profile"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Profile Button */}
                    {profiles.length < (user?.max_profiles ?? 2) && (
                      <button
                        onClick={() => setShowAddProfile(true)}
                        className="bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-gray-800/50 transition"
                      >
                        <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-gray-400">Add Profile</h3>
                      </button>
                    )}
                  </div>

                  {/* Add Profile Modal */}
                  {showAddProfile && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full">
                        <h3 className="text-2xl font-bold mb-6">Add New Profile</h3>

                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2">Profile Name</label>
                          <input
                            type="text"
                            value={newProfileName}
                            onChange={(e) => setNewProfileName(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter profile name"
                          />
                        </div>

                        <div className="mb-6">
                          <label className="block text-sm font-medium mb-2">Profile Image</label>
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 border-2 border-gray-700 flex items-center justify-center flex-shrink-0">
                              {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              )}
                            </div>
                            <label className="flex-1 cursor-pointer">
                              <div className="w-full px-4 py-3 bg-gray-800 text-gray-400 rounded-lg border-2 border-dashed border-gray-700 hover:border-blue-500 hover:text-white transition text-center text-sm">
                                {profileImage ? profileImage.name : 'Click to upload image'}
                              </div>
                              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                          </div>
                        </div>

                        <div className="mb-6">
                          <label className="block text-sm font-medium mb-3">Maturity Level</label>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setMaturityLevel('ADULT')}
                              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${maturityLevel === 'ADULT'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                                }`}
                            >
                              🎬 Adult
                            </button>
                            <button
                              type="button"
                              onClick={() => setMaturityLevel('KIDS')}
                              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${maturityLevel === 'KIDS'
                                ? 'bg-yellow-500 text-black'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                                }`}
                            >
                              🧒 Kids
                            </button>
                          </div>
                          {maturityLevel === 'KIDS' && (
                            <p className="text-xs text-yellow-400 mt-2">Kids profiles only show age-appropriate content.</p>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleAddProfile}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition"
                          >
                            Create Profile
                          </button>
                          <button
                            onClick={() => {
                              setShowAddProfile(false);
                              setNewProfileName('');
                              setProfileImage(null);
                              setImagePreview(null);
                              setMaturityLevel('ADULT');
                            }}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edit Profile Modal */}
                  {showEditProfile && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full">
                        <h3 className="text-2xl font-bold mb-6">Edit Profile</h3>

                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2">Profile Name</label>
                          <input
                            type="text"
                            value={newProfileName}
                            onChange={(e) => setNewProfileName(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter profile name"
                          />
                        </div>

                        <div className="mb-6">
                          <label className="block text-sm font-medium mb-2">Profile Image</label>
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 border-2 border-gray-700 flex items-center justify-center flex-shrink-0">
                              {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              )}
                            </div>
                            <label className="flex-1 cursor-pointer">
                              <div className="w-full px-4 py-3 bg-gray-800 text-gray-400 rounded-lg border-2 border-dashed border-gray-700 hover:border-blue-500 hover:text-white transition text-center text-sm">
                                {profileImage ? profileImage.name : 'Click to change image (optional)'}
                              </div>
                              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                          </div>
                        </div>

                        <div className="mb-6">
                          <label className="block text-sm font-medium mb-3">Maturity Level</label>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setMaturityLevel('ADULT')}
                              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${maturityLevel === 'ADULT'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                                }`}
                            >
                              🎬 Adult
                            </button>
                            <button
                              type="button"
                              onClick={() => setMaturityLevel('KIDS')}
                              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${maturityLevel === 'KIDS'
                                ? 'bg-yellow-500 text-black'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                                }`}
                            >
                              🧒 Kids
                            </button>
                          </div>
                          {maturityLevel === 'KIDS' && (
                            <p className="text-xs text-yellow-400 mt-2">Kids profiles only show age-appropriate content.</p>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleUpdateProfile}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => {
                              setShowEditProfile(false);
                              setEditingProfile(null);
                              setNewProfileName('');
                              setProfileImage(null);
                              setImagePreview(null);
                              setMaturityLevel('ADULT');
                            }}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mt-6">
                    <p className="text-sm text-blue-300">
                      💡 Your current plan allows up to <span className="font-semibold text-white">{user?.max_profiles ?? 2}</span> profile{(user?.max_profiles ?? 2) !== 1 ? 's' : ''}.
                      {profiles.length >= (user?.max_profiles ?? 2) && (
                        <> <button onClick={() => router.push('/plans')} className="underline text-yellow-400 hover:text-yellow-300 ml-1">Upgrade your plan</button> to add more.</>
                      )}
                    </p>
                  </div>

                  {/* Upgrade Banner — shown when at limit with no subscription */}
                  {profiles.length >= (user?.max_profiles ?? 2) && !subscription && suggestedPlans.length > 0 && (
                    <div className="mt-8">
                      <div className="text-center mb-5">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Free plan limit reached</p>
                        <h3 className="text-xl font-bold">Unlock more profiles with a plan</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {suggestedPlans.map((plan) => {
                          const isPopular = plan.name === 'STANDARD';
                          return (
                            <div
                              key={plan.id}
                              onClick={() => router.push('/plans')}
                              className={`relative rounded-xl p-5 border-2 cursor-pointer transition-all hover:scale-105 ${isPopular
                                ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/20'
                                : 'border-gray-700 bg-gray-800/30 hover:border-gray-500'
                                }`}
                            >
                              {isPopular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                  <span className="bg-blue-600 text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                                </div>
                              )}
                              <h4 className="font-bold text-base mb-1">{plan.display_name}</h4>
                              <p className="text-xl font-bold mb-1">₹{plan.monthly_price}<span className="text-xs text-gray-400">/mo</span></p>
                              <ul className="text-xs text-gray-400 space-y-1 mt-3">
                                <li>✓ {plan.max_profiles} profiles</li>
                                <li>✓ {plan.video_quality} quality</li>
                                <li>✓ {plan.max_simultaneous_streams} stream{plan.max_simultaneous_streams > 1 ? 's' : ''}</li>
                                {!plan.has_ads && <li>✓ Ad-free</li>}
                                {plan.can_download && <li>✓ Downloads</li>}
                              </ul>
                              <button className={`w-full mt-4 py-2 rounded-lg text-sm font-semibold transition ${isPopular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
                                }`}>
                                Choose {plan.display_name}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Account Information */}
              {activeSection === 'account' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6">Account Information</h2>

                  <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-lg p-6">
                      <label className="block text-sm text-gray-400 mb-2">Username</label>
                      <p className="text-xl font-semibold">{user?.username}</p>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-6">
                      <label className="block text-sm text-gray-400 mb-2">Email</label>
                      <p className="text-xl font-semibold">{user?.email || 'Not provided'}</p>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-6">
                      <label className="block text-sm text-gray-400 mb-2">Member Since</label>
                      <p className="text-xl font-semibold">{user?.member_since || 'N/A'}</p>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-6">
                      <label className="block text-sm text-gray-400 mb-2">Total Profiles</label>
                      <p className="text-xl font-semibold">{user?.profile_count || profiles.length} / {user?.max_profiles ?? 2}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy & Security */}
              {activeSection === 'security' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6">Privacy & Security</h2>

                  {/* Change Password */}
                  <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
                    <h3 className="text-xl font-semibold mb-4">Change Password</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label className="block text-sm mb-2">Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-2">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition"
                      >
                        Update Password
                      </button>
                    </form>
                  </div>

                  {/* Activity Log */}
                  <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
                    <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-3 border-b border-gray-700">
                        <div>
                          <p className="font-medium">Login from Windows PC</p>
                          <p className="text-sm text-gray-400">Chrome Browser • 192.168.1.1</p>
                        </div>
                        <span className="text-sm text-gray-400">2 hours ago</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-gray-700">
                        <div>
                          <p className="font-medium">Profile Created</p>
                          <p className="text-sm text-gray-400">New profile added</p>
                        </div>
                        <span className="text-sm text-gray-400">1 day ago</span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <div>
                          <p className="font-medium">Password Changed</p>
                          <p className="text-sm text-gray-400">Security update</p>
                        </div>
                        <span className="text-sm text-gray-400">3 days ago</span>
                      </div>
                    </div>
                  </div>

                  {/* Sign Out & Delete */}
                  <div className="space-y-4">
                    <button
                      onClick={handleSignOut}
                      className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold transition"
                    >
                      Sign Out of All Devices
                    </button>

                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 py-3 rounded-lg font-semibold transition"
                    >
                      Delete Account
                    </button>
                  </div>

                  {/* Delete Account Confirmation Modal */}
                  {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full border-2 border-red-600/50">
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <h3 className="text-2xl font-bold text-red-400 mb-2">Delete Account</h3>
                          <p className="text-gray-400 mb-4">
                            This action cannot be undone. All your data, profiles, and watchlists will be permanently deleted.
                          </p>
                        </div>

                        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 mb-6">
                          <p className="text-sm text-red-300 mb-3">
                            Type <span className="font-bold text-red-400">DELETE</span> to confirm:
                          </p>
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-center font-semibold"
                            placeholder="Type DELETE"
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmText !== 'DELETE'}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 rounded-lg font-semibold transition"
                          >
                            Delete Forever
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              setDeleteConfirmText('');
                            }}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subscription & Billing */}
              {activeSection === 'billing' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6">Subscription & Billing</h2>

                  {subscription ? (
                    <>
                      {/* Current Plan */}
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-2xl font-bold mb-2">{subscription.plan_details?.display_name || 'Plan'}</h3>
                            <p className="text-blue-100 mb-4">{subscription.plan_details?.description || 'Streaming plan'}</p>
                            <p className="text-3xl font-bold">
                              ₹{subscription.billing_cycle === 'MONTHLY' ? subscription.plan_details?.monthly_price : subscription.plan_details?.yearly_price}
                              <span className="text-lg font-normal">/{subscription.billing_cycle === 'MONTHLY' ? 'month' : 'year'}</span>
                            </p>
                            {subscription.days_left !== undefined && (
                              <p className="text-sm text-blue-200 mt-2">
                                {subscription.days_left} days remaining
                              </p>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${subscription.status === 'ACTIVE' ? 'bg-green-500/20 text-green-300' :
                            subscription.status === 'TRIAL' ? 'bg-blue-500/20 text-blue-300' :
                              subscription.status === 'CANCELLED' ? 'bg-red-500/20 text-red-300' :
                                'bg-gray-500/20 text-gray-300'
                            }`}>
                            {subscription.status}
                          </span>
                        </div>
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => router.push('/plans')}
                            className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg font-semibold transition"
                          >
                            Change Plan
                          </button>
                          {subscription.status === 'ACTIVE' && (
                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to cancel your subscription?')) {
                                  try {
                                    const token = localStorage.getItem('access_token');
                                    await api.cancelSubscription(token);
                                    alert('Subscription cancelled successfully');
                                    loadAccountData();
                                  } catch (error) {
                                    alert(error.message || 'Failed to cancel subscription');
                                  }
                                }
                              }}
                              className="bg-red-600/20 hover:bg-red-600/30 text-red-300 px-6 py-2 rounded-lg font-semibold transition"
                            >
                              Cancel Subscription
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Plan Features */}
                      {subscription.plan_details && (
                        <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
                          <h3 className="text-xl font-semibold mb-4">Plan Features</h3>
                          <ul className="space-y-3">
                            <li className="flex items-center gap-3">
                              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>{subscription.plan_details.video_quality} quality streaming</span>
                            </li>
                            <li className="flex items-center gap-3">
                              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Watch on {subscription.plan_details.max_simultaneous_streams} device{subscription.plan_details.max_simultaneous_streams > 1 ? 's' : ''} at a time</span>
                            </li>
                            <li className="flex items-center gap-3">
                              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Up to {subscription.plan_details.max_profiles} profiles</span>
                            </li>
                            <li className="flex items-center gap-3">
                              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>{subscription.plan_details.has_ads ? 'With ads' : 'Ad-free experience'}</span>
                            </li>
                            {subscription.plan_details.can_download && (
                              <li className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Download for offline viewing</span>
                              </li>
                            )}
                            {subscription.plan_details.priority_support && (
                              <li className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Priority customer support</span>
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Billing History */}
                      <div className="bg-gray-800/50 rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">Billing History</h3>
                        {paymentHistory.length > 0 ? (
                          <div className="space-y-3">
                            {paymentHistory.map((payment) => (
                              <div key={payment.id} className="flex justify-between items-center py-3 border-b border-gray-700 last:border-0">
                                <div>
                                  <p className="font-medium">{new Date(payment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                  <p className="text-sm text-gray-400">{payment.subscription_plan}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">₹{payment.amount}</p>
                                  <span className={`text-xs px-2 py-1 rounded ${payment.payment_status === 'SUCCESS' ? 'bg-green-600/20 text-green-400' :
                                    payment.payment_status === 'PENDING' ? 'bg-yellow-600/20 text-yellow-400' :
                                      payment.payment_status === 'FAILED' ? 'bg-red-600/20 text-red-400' :
                                        'bg-gray-600/20 text-gray-400'
                                    }`}>
                                    {payment.payment_status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-center py-4">No payment history available</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="bg-gray-800/50 rounded-lg p-8 text-center">
                      <div className="text-6xl mb-4">📦</div>
                      <h3 className="text-2xl font-bold mb-2">No Active Subscription</h3>
                      <p className="text-gray-400 mb-6">Subscribe to a plan to enjoy unlimited streaming</p>
                      <button
                        onClick={() => router.push('/plans')}
                        className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition"
                      >
                        View Plans
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Help & Support */}
              {activeSection === 'help' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6">Help & Support</h2>

                  {/* Quick Links */}
                  <div className="grid md:grid-cols-2 gap-4 mb-8">
                    {[
                      { title: 'FAQ', desc: 'Find answers to common questions', icon: '❓' },
                      { title: 'Contact Support', desc: 'Get help from our team', icon: '💬' },
                      { title: 'Terms of Service', desc: 'Read our terms and conditions', icon: '📄' },
                      { title: 'Privacy Policy', desc: 'Learn how we protect your data', icon: '🔒' },
                    ].map((item, index) => (
                      <button
                        key={index}
                        className="bg-gray-800/50 hover:bg-gray-700/50 rounded-lg p-6 text-left transition"
                      >
                        <div className="text-3xl mb-3">{item.icon}</div>
                        <h3 className="font-semibold mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-400">{item.desc}</p>
                      </button>
                    ))}
                  </div>

                  {/* About */}
                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">About StreamVerse</h3>
                    <p className="text-gray-400 mb-4">
                      StreamVerse is your ultimate entertainment destination. Watch unlimited movies, TV shows, and listen to music anytime, anywhere.
                    </p>
                    <p className="text-sm text-gray-500">Version 1.0.0</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
