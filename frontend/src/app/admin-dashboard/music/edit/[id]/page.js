'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminApi } from '@/lib/adminApi';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import Breadcrumb from '@/components/admin/Breadcrumb';

export default function EditMusic() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [calculatingDuration, setCalculatingDuration] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [currentFiles, setCurrentFiles] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    genre: '',
    duration: '',
  });
  const [files, setFiles] = useState({
    audio_file: null,
    thumbnail_file: null,
  });

  const steps = [
    { id: 1, title: 'Basic Information', description: 'Title, artist, and album details' },
    { id: 2, title: 'Audio Files', description: 'Update audio and thumbnail files' },
    { id: 3, title: 'Music Details', description: 'Genre and duration information' },
    { id: 4, title: 'Review & Update', description: 'Review all changes before updating' }
  ];

  useEffect(() => {
    fetchMusic();
  }, []);

  const fetchMusic = async () => {
    try {
      const musicList = await adminApi.getMusic();
      const music = musicList.find(m => m.id === parseInt(params.id));

      if (music) {
        setFormData({
          title: music.title || '',
          artist: music.artist || '',
          album: music.album || '',
          genre: music.genre || '',
          duration: music.duration || '',
        });
        setCurrentFiles({
          audio_file: music.audio_file || '',
          thumbnail: music.thumbnail || '',
        });

        // Auto-calculate duration from existing audio file if duration is 0 or empty
        if ((!music.duration || music.duration === 0) && music.audio_file) {
          setCalculatingDuration(true);
          const audio = document.createElement('audio');
          audio.preload = 'metadata';
          audio.crossOrigin = 'anonymous';

          audio.onloadedmetadata = function () {
            const durationInSeconds = Math.round(audio.duration);
            setFormData(prev => ({ ...prev, duration: durationInSeconds }));
            setCalculatingDuration(false);
          };

          audio.onerror = function () {
            setCalculatingDuration(false);
          };

          audio.src = music.audio_file;
        }
      }
    } catch (err) {
      toast.error('Failed to fetch music details');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value || '' }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));

      // Auto-calculate duration for audio file upload
      if (name === 'audio_file') {
        setCalculatingDuration(true);
        const file = selectedFiles[0];
        const audio = document.createElement('audio');
        audio.preload = 'metadata';

        audio.onloadedmetadata = function () {
          window.URL.revokeObjectURL(audio.src);
          const durationInSeconds = Math.round(audio.duration);
          setFormData(prev => ({ ...prev, duration: durationInSeconds }));
          setCalculatingDuration(false);
        };

        audio.onerror = function () {
          setCalculatingDuration(false);
          toast.warning('Could not read audio metadata. Please enter duration manually.');
        };

        audio.src = URL.createObjectURL(file);
      }
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.title && formData.artist;
      case 2:
        return true; // Files are optional in edit mode
      case 3:
        return formData.genre && formData.duration;
      case 4:
        return validateStep(1) && validateStep(3);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    } else {
      toast.warning('Please fill in all required fields before proceeding.');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step) => {
    if (step <= currentStep || completedSteps.has(step - 1)) {
      setCurrentStep(step);
    }
  };

  const handleFinalSubmit = async () => {
    if (!validateStep(4)) {
      toast.warning('Please complete all required fields before updating.');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Append text fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append new files if selected
      if (files.audio_file) {
        formDataToSend.append('audio_file', files.audio_file);
      }
      if (files.thumbnail_file) {
        formDataToSend.append('thumbnail_file', files.thumbnail_file);
      }

      await adminApi.updateMusicWithFiles(params.id, formDataToSend);
      toast.success('Music updated successfully!');
      router.push('/admin-dashboard/music');
    } catch (err) {
      toast.error(err.message || 'Failed to update music');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading music details...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4">
      <div className="w-full max-w-4xl">
        <Breadcrumb items={[{ label: 'Music', href: '/admin-dashboard/music' }, { label: 'Edit Music' }]} />
        <h1 className="text-3xl font-bold text-white mb-4 text-center">Edit Music</h1>

        {/* Step Progress Indicator */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(step.id)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    currentStep === step.id
                      ? 'bg-red-600 border-red-600 text-white'
                      : completedSteps.has(step.id)
                        ? 'bg-green-600 border-green-600 text-white'
                        : currentStep > step.id || completedSteps.has(step.id - 1)
                          ? 'border-gray-400 text-gray-400 hover:border-red-500 hover:text-red-500 cursor-pointer'
                          : 'border-gray-600 text-gray-600 cursor-not-allowed'
                  }`}
                  disabled={step.id > currentStep && !completedSteps.has(step.id - 1)}
                >
                  {completedSteps.has(step.id) ? (
                    <Check size={16} />
                  ) : (
                    step.id
                  )}
                </button>
                {index < steps.length - 1 && (
                  <div className={`w-20 h-0.5 mx-2 ${
                    completedSteps.has(step.id) ? 'bg-green-600' : 'bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-1">
              Step {currentStep}: {steps[currentStep - 1].title}
            </h2>
            <p className="text-gray-400 text-sm">
              {steps[currentStep - 1].description}
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-gray-800 rounded-lg p-6 w-full">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-white mb-2">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleChange}
                  placeholder="Enter the music title"
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-2">Artist <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="artist"
                  value={formData.artist || ''}
                  onChange={handleChange}
                  placeholder="Enter the artist name"
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-2">Album</label>
                <input
                  type="text"
                  name="album"
                  value={formData.album || ''}
                  onChange={handleChange}
                  placeholder="Enter the album name (optional)"
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                />
              </div>
            </div>
          )}

          {/* Step 2: Audio Files */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Audio File Upload */}
              <div>
                <label className="block text-white mb-2">Audio File</label>
                {currentFiles.audio_file && (
                  <div className="mb-3 p-3 bg-gray-700/50 rounded border border-gray-600">
                    <p className="text-gray-300 text-sm font-medium mb-1">Current file:</p>
                    <p className="text-green-400 text-sm truncate">{currentFiles.audio_file.split('/').pop()}</p>
                  </div>
                )}
                <input
                  type="file"
                  name="audio_file"
                  onChange={handleFileChange}
                  accept="audio/*"
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-red-600 file:text-white file:cursor-pointer hover:file:bg-red-700"
                />
                {files.audio_file && (
                  <p className="text-green-400 text-sm mt-1">
                    New file selected: {files.audio_file.name} ({(files.audio_file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Leave empty to keep current file. Upload MP3, WAV, or other audio formats.
                </p>
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-white mb-2">Thumbnail Image (Optional)</label>
                {currentFiles.thumbnail && (
                  <div className="mb-3 p-3 bg-gray-700/50 rounded border border-gray-600">
                    <p className="text-gray-300 text-sm font-medium mb-2">Current thumbnail:</p>
                    <div className="w-32 h-32 bg-gray-600 rounded border border-gray-500 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Album Art</span>
                    </div>
                    <p className="text-green-400 text-xs mt-1">{currentFiles.thumbnail.split('/').pop()}</p>
                  </div>
                )}
                <input
                  type="file"
                  name="thumbnail_file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-red-600 file:text-white file:cursor-pointer hover:file:bg-red-700"
                />
                {files.thumbnail_file && (
                  <div className="mt-2">
                    <p className="text-green-400 text-sm">
                      New file selected: {files.thumbnail_file.name}
                    </p>
                  </div>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Leave empty to keep current thumbnail. Recommended size: 500x500 or square aspect ratio.
                </p>
              </div>

              {calculatingDuration && (
                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                    <div>
                      <p className="text-blue-400 font-semibold">Recalculating Duration</p>
                      <p className="text-gray-300 text-sm">
                        Reading new audio metadata to update duration...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Music Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2">Genre <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="genre"
                    value={formData.genre || ''}
                    onChange={handleChange}
                    placeholder="e.g., Pop, Rock, Jazz"
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Duration (seconds) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration || ''}
                      onChange={handleChange}
                      min="1"
                      placeholder="Auto-calculated from audio"
                      className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                      readOnly={files.audio_file && formData.duration}
                      required
                    />
                    {calculatingDuration && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-1">
                    {calculatingDuration
                      ? "⏳ Calculating duration from audio..."
                      : files.audio_file && formData.duration
                        ? `✓ Duration updated from audio: ${Math.floor(formData.duration / 60)}m ${formData.duration % 60}s`
                        : formData.duration
                          ? `Current: ${Math.floor(formData.duration / 60)}m ${formData.duration % 60}s`
                          : "Upload a new audio file to auto-calculate duration"}
                  </p>
                </div>
              </div>

              {files.audio_file && (
                <div className="bg-green-900/20 border border-green-500/30 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-green-400 font-semibold mb-1">New Audio File Uploaded</p>
                      <p className="text-gray-300 text-sm">
                        {files.audio_file.name} ({(files.audio_file.size / 1024 / 1024).toFixed(2)} MB)
                        {formData.duration && ` - Duration: ${Math.floor(formData.duration / 60)}m ${formData.duration % 60}s`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review & Update */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-gray-700/50 p-6 rounded">
                <h3 className="text-white font-semibold mb-4">Review Your Changes</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-gray-300 font-medium mb-2">Music Information</h4>
                    <p className="text-sm text-gray-400 mb-1"><strong>Title:</strong> {formData.title}</p>
                    <p className="text-sm text-gray-400 mb-1"><strong>Artist:</strong> {formData.artist}</p>
                    <p className="text-sm text-gray-400 mb-1"><strong>Album:</strong> {formData.album || 'Not set'}</p>
                    <p className="text-sm text-gray-400"><strong>Genre:</strong> {formData.genre}</p>
                  </div>
                  <div>
                    <h4 className="text-gray-300 font-medium mb-2">Music Details</h4>
                    <p className="text-sm text-gray-400 mb-1">
                      <strong>Duration:</strong> {formData.duration ? `${Math.floor(formData.duration / 60)}m ${formData.duration % 60}s` : 'Not set'}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-gray-300 font-medium mb-2">File Changes</h4>
                  <p className="text-sm text-gray-400 mb-1">
                    <strong>Audio:</strong> {files.audio_file ? `New file: ${files.audio_file.name}` : 'No changes'}
                  </p>
                  <p className="text-sm text-gray-400">
                    <strong>Thumbnail:</strong> {files.thumbnail_file ? `New file: ${files.thumbnail_file.name}` : 'No changes'}
                  </p>
                </div>
              </div>

              {/* Update Notice */}
              <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-blue-400 font-semibold mb-1">Ready to Update</p>
                    <p className="text-gray-300 text-sm">
                      Review your changes above and click "Update Music" to save the modifications.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 mt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            <div className="flex gap-4">
              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading || !validateStep(4)}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Music'}
                  <Check size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
