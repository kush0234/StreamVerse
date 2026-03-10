'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

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
      const data = await api.getProfiles(token);
      setProfiles(data);
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
      await api.createProfile(token, newProfileName);
      setNewProfileName('');
      setShowCreateForm(false);
      loadProfiles();
    } catch (err) {
      console.error('Failed to create profile', err);
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
      <div className="fixed top-0 w-full z-50 px-8 py-6 glass-effect">
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

      <div className="pt-32 pb-20 px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl font-bold mb-12 text-center animate-fade-in">
            Who's Watching?
          </h1>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            {profiles.map((profile, index) => (
              <div
                key={profile.id}
                onClick={() => selectProfile(profile)}
                className="flex flex-col items-center cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative mb-4">
                  {profile.profile_image ? (
                    <img
                      src={profile.profile_image}
                      alt={profile.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-transparent group-hover:border-white transition-all duration-300 shadow-2xl"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-5xl font-bold border-4 border-transparent group-hover:border-white transition-all duration-300 shadow-2xl group-hover:scale-110">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                <span className="text-lg font-medium text-gray-400 group-hover:text-white transition-colors text-center">
                  {profile.name}
                </span>
              </div>
            ))}

            {/* Add Profile Button */}
            <div
              onClick={() => setShowCreateForm(true)}
              className="flex flex-col items-center cursor-pointer group animate-fade-in"
              style={{ animationDelay: `${profiles.length * 100}ms` }}
            >
              <div className="w-32 h-32 rounded-full flex items-center justify-center border-4 border-gray-700 group-hover:border-white transition-all duration-300 mb-4 group-hover:scale-110">
                <svg className="w-16 h-16 text-gray-700 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-lg font-medium text-gray-400 group-hover:text-white transition-colors">
                Add Profile
              </span>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-8 py-3 border-2 border-gray-600 hover:border-white text-gray-400 hover:text-white rounded transition-all duration-300 font-medium"
            >
              Manage Profiles
            </button>
          </div>
        </div>
      </div>

      {/* Create Profile Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gradient-to-b from-gray-900 to-black p-8 rounded-2xl w-full max-w-md border border-gray-800 shadow-2xl">
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
