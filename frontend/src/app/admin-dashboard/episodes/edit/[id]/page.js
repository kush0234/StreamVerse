'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminApi } from '@/lib/adminApi';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import Breadcrumb from '@/components/admin/Breadcrumb';

export default function EditEpisode() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [calculatingDuration, setCalculatingDuration] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [series, setSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [currentFiles, setCurrentFiles] = useState({});
  const [formData, setFormData] = useState({
    series: '',
    title: '',
    description: '',
    season_number: '',
    episode_number: '',
    duration: '',
  });
  const [files, setFiles] = useState({
    video_file: null,
    thumbnail_file: null,
  });

  const steps = [
    { id: 1, title: 'Series & Basic Info', description: 'Select series, title, and description' },
    { id: 2, title: 'Media Files', description: 'Update video and thumbnail files' },
    { id: 3, title: 'Episode Details', description: 'Season, episode number, and duration' },
    { id: 4, title: 'Review & Update', description: 'Review all changes before updating' }
  ];

  useEffect(() => {
    const loadData = async () => {
      await fetchSeries();
      await fetchEpisode();
    };
    loadData();
  }, []);

  const fetchSeries = async () => {
    try {
      const data = await adminApi.getVideos('SERIES');
      setSeries(data);
      return data; // Return data for use in fetchEpisode
    } catch (err) {
      console.error('Failed to fetch series');
      return [];
    }
  };

  const fetchEpisode = async () => {
    try {
      const episodes = await adminApi.getEpisodes();
      const episode = episodes.find(ep => ep.id === parseInt(params.id));

      if (episode) {
        // Convert seconds to minutes, but if duration is 0 or invalid, leave it empty for user to fill
        const durationInMinutes = episode.duration && episode.duration > 0
          ? Math.round(episode.duration / 60)
          : '';

        setFormData({
          series: episode.series || '',
          title: episode.title || '',
          description: episode.description || '',
          season_number: episode.season_number || '',
          episode_number: episode.episode_number || '',
          duration: durationInMinutes,
        });

        // Find and set the selected series
        const selected = series.find(s => s.id === episode.series);
        setSelectedSeries(selected);

        setCurrentFiles({
          video_url: episode.video_url || '',
          thumbnail_url: episode.thumbnail_url || '',
        });

        // Auto-calculate duration from existing video file if duration is 0 or empty
        if ((!episode.duration || episode.duration === 0) && episode.video_url) {
          setCalculatingDuration(true);
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.crossOrigin = 'anonymous';

          video.onloadedmetadata = function () {
            const durationInSeconds = Math.round(video.duration);
            const durationInMinutes = Math.round(durationInSeconds / 60);
            setFormData(prev => ({ ...prev, duration: durationInMinutes }));
            setCalculatingDuration(false);
          };

          video.onerror = function () {
            setCalculatingDuration(false);
          };

          video.src = episode.video_url;
        }
      }
    } catch (err) {
      toast.error('Failed to fetch episode details');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value || '' }));

    // Track selected series
    if (name === 'series') {
      const selected = series.find(s => s.id === parseInt(value));
      setSelectedSeries(selected);
    }
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));

      // Auto-calculate duration for any new video file upload
      if (name === 'video_file') {
        setCalculatingDuration(true);
        const file = selectedFiles[0];
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = function () {
          window.URL.revokeObjectURL(video.src);
          const durationInSeconds = Math.round(video.duration);
          const durationInMinutes = Math.round(durationInSeconds / 60);
          setFormData(prev => ({ ...prev, duration: durationInMinutes }));
          setCalculatingDuration(false);
        };

        video.onerror = function () {
          setCalculatingDuration(false);
          toast.warning('Could not read video metadata. Please enter duration manually.');
        };

        video.src = URL.createObjectURL(file);
      }
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.series && formData.title && formData.description;
      case 2:
        return true; // Files are optional in edit mode
      case 3:
        return formData.season_number && formData.episode_number && formData.duration;
      case 4:
        return validateStep(1) && validateStep(3); // Skip step 2 validation since files are optional
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
          // Convert duration from minutes to seconds for backend
          if (key === 'duration') {
            formDataToSend.append(key, formData[key] * 60);
          } else {
            formDataToSend.append(key, formData[key]);
          }
        }
      });

      // Append new files if selected
      if (files.video_file) {
        formDataToSend.append('video_file', files.video_file);
      }
      if (files.thumbnail_file) {
        formDataToSend.append('thumbnail', files.thumbnail_file);
      }

      await adminApi.updateEpisodeWithFiles(params.id, formDataToSend);
      toast.success('Episode updated successfully!');
      router.push('/admin-dashboard/episodes');
    } catch (err) {
      toast.error(err.message || 'Failed to update episode');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading episode details...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4">
      <div className="w-full max-w-4xl">
        <Breadcrumb items={[{ label: 'Episodes', href: '/admin-dashboard/episodes' }, { label: 'Edit Episode' }]} />
        <h1 className="text-3xl font-bold text-white mb-4 text-center">Edit Episode</h1>

        {/* Step Progress Indicator */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(step.id)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${currentStep === step.id
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
                  <div className={`w-20 h-0.5 mx-2 ${completedSteps.has(step.id) ? 'bg-green-600' : 'bg-gray-600'
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
          {/* Step 1: Series & Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-white mb-2">Select Series <span className="text-red-500">*</span></label>
                <select
                  name="series"
                  value={formData.series}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                  required
                >
                  <option value="">-- Select a Series --</option>
                  {series.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
                {selectedSeries && (
                  <div className="mt-2 p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                    <p className="text-blue-400 text-sm">
                      <strong>Selected Series:</strong> {selectedSeries.title}<br />
                      <strong>Type:</strong> {selectedSeries.is_public_domain ? 'Local Upload' : 'YouTube Embed'}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-white mb-2">Episode Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleChange}
                  placeholder="Enter the episode title"
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-2">Description <span className="text-red-500">*</span></label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Provide a detailed description of this episode..."
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Media Files */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Video File Upload */}
              <div>
                <label className="block text-white mb-2">Video File</label>
                {currentFiles.video_url && (
                  <div className="mb-3 p-3 bg-gray-700/50 rounded border border-gray-600">
                    <p className="text-gray-300 text-sm font-medium mb-1">Current file:</p>
                    <p className="text-green-400 text-sm truncate">{currentFiles.video_url.split('/').pop()}</p>
                  </div>
                )}
                <input
                  type="file"
                  name="video_file"
                  onChange={handleFileChange}
                  accept="video/*"
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-red-600 file:text-white file:cursor-pointer hover:file:bg-red-700"
                />
                {files.video_file && (
                  <p className="text-green-400 text-sm mt-1">
                    New file selected: {files.video_file.name} ({(files.video_file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Leave empty to keep current file. Upload MP4 format for best compatibility.
                </p>
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-white mb-2">Thumbnail Image (Optional)</label>
                {currentFiles.thumbnail_url && (
                  <div className="mb-3 p-3 bg-gray-700/50 rounded border border-gray-600">
                    <p className="text-gray-300 text-sm font-medium mb-2">Current thumbnail:</p>
                    <div className="w-32 h-20 bg-gray-600 rounded border border-gray-500 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Thumbnail Preview</span>
                    </div>
                    <p className="text-green-400 text-xs mt-1">{currentFiles.thumbnail_url.split('/').pop()}</p>
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
                  Leave empty to keep current thumbnail. Recommended size: 1920x1080 or 16:9 aspect ratio.
                </p>
              </div>

              {selectedSeries && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-yellow-400 font-semibold mb-1">File Update</p>
                      <p className="text-gray-300 text-sm">
                        This episode belongs to "{selectedSeries.title}" which uses {selectedSeries.is_public_domain ? 'local file storage' : 'YouTube embedding'}.
                        {selectedSeries.is_public_domain ? ' Duration will be recalculated if you upload a new video file.' : ' Duration can be updated in the next step.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {calculatingDuration && (
                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                    <div>
                      <p className="text-blue-400 font-semibold">Recalculating Duration</p>
                      <p className="text-gray-300 text-sm">
                        Reading new video metadata to update duration...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Episode Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2">Season Number <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="season_number"
                    value={formData.season_number || ''}
                    onChange={handleChange}
                    min="1"
                    placeholder="e.g., 1"
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Episode Number <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="episode_number"
                    value={formData.episode_number || ''}
                    onChange={handleChange}
                    min="1"
                    placeholder="e.g., 1"
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white mb-2">Duration (minutes) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration || ''}
                    onChange={handleChange}
                    min="1"
                    placeholder={selectedSeries?.is_public_domain ? "Auto-calculated from video" : "Enter duration"}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                    readOnly={selectedSeries?.is_public_domain && files.video_file && formData.duration}
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
                    ? "⏳ Calculating duration from video..."
                    : selectedSeries?.is_public_domain && files.video_file && formData.duration
                      ? `✓ Duration updated from video: ${formData.duration} minutes`
                      : selectedSeries?.is_public_domain && files.video_file
                        ? "Duration will be calculated from uploaded video"
                        : formData.duration
                          ? `Current: ${formData.duration} minutes`
                          : "Enter duration manually or upload a new video file to auto-calculate"}
                </p>
              </div>

              {selectedSeries && (
                <div className="bg-gray-700/50 p-4 rounded">
                  <h3 className="text-white font-medium mb-2">Series Information</h3>
                  <p className="text-gray-400 text-sm mb-1"><strong>Series:</strong> {selectedSeries.title}</p>
                  <p className="text-gray-400 text-sm mb-1"><strong>Genre:</strong> {selectedSeries.genre}</p>
                  <p className="text-gray-400 text-sm"><strong>Storage Type:</strong> {selectedSeries.is_public_domain ? 'Local Upload' : 'YouTube Embed'}</p>
                </div>
              )}

              {files.video_file && (
                <div className="bg-green-900/20 border border-green-500/30 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-green-400 font-semibold mb-1">New Video File Uploaded</p>
                      <p className="text-gray-300 text-sm">
                        {files.video_file.name} ({(files.video_file.size / 1024 / 1024).toFixed(2)} MB)
                        {selectedSeries?.is_public_domain && formData.duration &&
                          ` - Duration updated: ${formData.duration} minutes`
                        }
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
                    <h4 className="text-gray-300 font-medium mb-2">Episode Information</h4>
                    <p className="text-sm text-gray-400 mb-1"><strong>Series:</strong> {series.find(s => s.id === parseInt(formData.series))?.title || 'Not selected'}</p>
                    <p className="text-sm text-gray-400 mb-1"><strong>Title:</strong> {formData.title}</p>
                    <p className="text-sm text-gray-400 mb-1"><strong>Season:</strong> {formData.season_number}</p>
                    <p className="text-sm text-gray-400"><strong>Episode:</strong> {formData.episode_number}</p>
                  </div>
                  <div>
                    <h4 className="text-gray-300 font-medium mb-2">Episode Details</h4>
                    <p className="text-sm text-gray-400 mb-1"><strong>Duration:</strong> {formData.duration ? `${formData.duration} minutes` : 'Not set'}</p>
                    <p className="text-sm text-gray-400 mb-1"><strong>Description:</strong> {formData.description ? 'Set' : 'Not set'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-gray-300 font-medium mb-2">File Changes</h4>
                  <p className="text-sm text-gray-400 mb-1">
                    <strong>Video:</strong> {files.video_file ? `New file: ${files.video_file.name}` : 'No changes'}
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
                      Review your changes above and click "Update Episode" to save the modifications.
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
                  {loading ? 'Updating...' : 'Update Episode'}
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
