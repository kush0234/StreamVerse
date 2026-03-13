'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/adminApi';
import { ArrowLeft, ArrowRight, Check, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function AddVideo() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [calculatingDuration, setCalculatingDuration] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'MOVIE',
    genre: '',
    release_date: new Date().toISOString().split('T')[0],
    duration: '',
    rating: '',
    is_public_domain: false,
    is_coming_soon: false,
    expected_release_date: '',
    youtube_trailer_url: '',
  });
  const [files, setFiles] = useState({
    video_file: null,
    thumbnail: null,
  });

  const steps = [
    { id: 1, title: 'Basic Information', description: 'Content type, title, and description' },
    { id: 2, title: 'Upload Method & Files', description: 'Choose upload method and upload video/thumbnail' },
    { id: 3, title: 'Details & Metadata', description: 'Genre, dates, rating, and duration' },
    { id: 4, title: 'Content Options', description: 'Coming soon and final settings' },
    { id: 5, title: 'Review & Submit', description: 'Review all information before submitting' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (value || '')
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));

      // Auto-calculate duration for video files
      if (name === 'video_file') {
        setCalculatingDuration(true);
        const file = selectedFiles[0];
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = function () {
          window.URL.revokeObjectURL(video.src);
          const duration = Math.round(video.duration); // Duration in seconds
          setFormData(prev => ({ ...prev, duration: duration }));
          setCalculatingDuration(false);
        };

        video.onerror = function () {
          setCalculatingDuration(false);
          alert('Could not read video metadata. Please enter duration manually.');
        };

        video.src = URL.createObjectURL(file);
      }
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.title && formData.description && formData.content_type;
      case 2:
        if (formData.is_coming_soon) {
          return files.thumbnail;
        }
        // For regular content, check upload method and files
        if (formData.content_type === 'MOVIE' && !formData.is_coming_soon) {
          if (formData.is_public_domain) {
            return files.video_file && files.thumbnail;
          } else {
            return formData.youtube_trailer_url && files.thumbnail;
          }
        }
        // For series, thumbnail is always required
        return files.thumbnail;
      case 3:
        return formData.genre && formData.release_date;
      case 4:
        return true; // Optional step
      case 5:
        return validateStep(1) && validateStep(2) && validateStep(3);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    } else {
      alert('Please fill in all required fields before proceeding.');
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
    if (!validateStep(5)) {
      alert('Please complete all required fields before submitting.');
      return;
    }

    // Validation - only required for movies and not coming soon
    if (formData.content_type === 'MOVIE' && !formData.is_coming_soon) {
      if (formData.is_public_domain && !files.video_file) {
        alert('Please select a video file for public domain content');
        return;
      }

      if (!formData.is_public_domain && !formData.youtube_trailer_url) {
        alert('Please enter a YouTube embed URL for non-public domain content');
        return;
      }
    }

    // For coming soon, only thumbnail is required
    if (formData.is_coming_soon && !files.thumbnail) {
      alert('Please upload a thumbnail for coming soon content');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Append text fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append files
      if (files.video_file) {
        formDataToSend.append('video_file', files.video_file);
      }
      if (files.thumbnail) {
        formDataToSend.append('thumbnail', files.thumbnail);
      }

      await adminApi.createVideoWithFiles(formDataToSend);
      alert('Video added successfully! It will be visible after SuperAdmin approval.');
      router.push('/admin-dashboard/videos');
    } catch (err) {
      alert(err.message || 'Failed to add video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center px-4">
      <div className="w-full max-w-4xl">
        <Link
          href="/admin-dashboard/videos"
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-2"
        >
          <ArrowLeft size={20} />
          Back to Videos
        </Link>

        <h1 className="text-3xl font-bold text-white mb-4 text-center">Add New Video</h1>

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
                  <div className={`w-16 h-0.5 mx-2 ${completedSteps.has(step.id) ? 'bg-green-600' : 'bg-gray-600'
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
        <div className="bg-gray-800 rounded-lg p-4 w-full">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2">Content Type <span className="text-red-500">*</span></label>
                  <select
                    name="content_type"
                    value={formData.content_type}
                    onChange={handleChange}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                    required
                  >
                    <option value="MOVIE">Movie</option>
                    <option value="SERIES">Series</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded w-full">
                    <p className="text-blue-400 text-sm">
                      <strong>Movie:</strong> Single standalone content<br />
                      <strong>Series:</strong> Multiple episodes (add episodes separately)
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-white mb-2">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleChange}
                  placeholder="Enter the title of your content"
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
                  placeholder="Provide a detailed description of your content..."
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Media Files */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Storage Type Selection - Move to Step 2 */}
              {!formData.is_coming_soon && (
                <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded mb-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <span className="text-xl">📁</span>
                    Choose Upload Method
                  </h3>
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_public_domain"
                      checked={formData.is_public_domain}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 mt-1"
                    />
                    <div>
                      <span className="text-white font-semibold">✅ Upload Local Video File</span>
                      <p className="text-gray-400 text-sm mt-1">
                        Check this to upload your own video file. Uncheck to use YouTube embed URL instead.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Video File Upload - Always render both, control visibility with CSS */}
              {!formData.is_coming_soon && (
                <div>
                  {/* Local Video Upload */}
                  <div className={`bg-green-900/20 border border-green-500/30 p-4 rounded ${!formData.is_public_domain ? 'hidden' : ''}`}>
                    <label className="block text-white mb-2">
                      📁 Upload Local Video File
                      {formData.content_type === 'MOVIE' && <span className="text-red-500">*</span>}
                      {formData.content_type === 'SERIES' && <span className="text-gray-400 text-sm ml-2">(Optional - for trailer/promo)</span>}
                    </label>
                    <input
                      type="file"
                      name="video_file"
                      onChange={handleFileChange}
                      accept="video/*"
                      className="w-full bg-gray-700 text-white px-4 py-2 rounded file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-green-600 file:text-white file:cursor-pointer hover:file:bg-green-700"
                      required={formData.content_type === 'MOVIE' && formData.is_public_domain}
                    />
                    {files.video_file && (
                      <p className="text-gray-400 text-sm mt-1">
                        ✅ Selected: {files.video_file.name} ({(files.video_file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                    <p className="text-green-400 text-xs mt-1">
                      {formData.content_type === 'SERIES'
                        ? '📺 Optional: Upload a trailer or promo video. Add episodes separately after creating the series.'
                        : '🎬 Upload MP4 format for best compatibility. Duration will be auto-calculated.'}
                    </p>
                  </div>

                  {/* YouTube URL Input */}
                  <div className={`bg-red-900/20 border border-red-500/30 p-4 rounded ${formData.is_public_domain ? 'hidden' : ''}`}>
                    <label className="block text-white mb-2">
                      🎬 YouTube Embed URL
                      {formData.content_type === 'MOVIE' && <span className="text-red-500">*</span>}
                      {formData.content_type === 'SERIES' && <span className="text-gray-400 text-sm ml-2">(Optional - for trailer/promo)</span>}
                    </label>
                    <input
                      type="url"
                      name="youtube_trailer_url"
                      value={formData.youtube_trailer_url || ''}
                      onChange={handleChange}
                      placeholder="https://www.youtube.com/embed/VIDEO_ID"
                      className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                      required={formData.content_type === 'MOVIE' && !formData.is_public_domain}
                    />
                    <p className="text-red-400 text-xs mt-1">
                      {formData.content_type === 'SERIES'
                        ? '📺 Optional: Add a YouTube trailer. Add episodes separately after creating the series.'
                        : '🔗 Use the embed URL format: https://www.youtube.com/embed/VIDEO_ID'}
                    </p>
                  </div>
                </div>
              )}

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-white mb-2">
                  🖼️ Thumbnail Image <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  name="thumbnail"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-red-600 file:text-white file:cursor-pointer hover:file:bg-red-700"
                  required
                />
                {files.thumbnail && (
                  <div className="mt-2">
                    <p className="text-gray-400 text-sm">
                      ✅ Selected: {files.thumbnail.name}
                    </p>
                  </div>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Upload a high-quality image that represents your content. Recommended size: 1920x1080 or 16:9 aspect ratio.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Details & Metadata */}
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
                    placeholder="e.g., Action, Drama, Comedy"
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Release Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="release_date"
                    value={formData.release_date || ''}
                    onChange={handleChange}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2">Rating (0-10)</label>
                  <input
                    type="number"
                    name="rating"
                    value={formData.rating || ''}
                    onChange={handleChange}
                    min="0"
                    max="10"
                    step="0.1"
                    placeholder="Optional rating"
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">
                    Duration (seconds)
                    {formData.is_public_domain && <span className="text-gray-400 text-sm ml-1">(Auto-calculated from video)</span>}
                    {!formData.is_public_domain && <span className="text-gray-400 text-sm ml-1">(Optional for YouTube)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration || ''}
                      onChange={handleChange}
                      min="1"
                      placeholder={formData.is_public_domain ? "Will auto-calculate from video" : "Optional - leave empty for YouTube"}
                      className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                      readOnly={formData.is_public_domain && files.video_file}
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
                      : formData.is_public_domain
                        ? formData.duration
                          ? `✓ Duration: ${Math.floor(formData.duration / 60)}m ${formData.duration % 60}s`
                          : "Leave empty to auto-calculate from uploaded video"
                        : "🎬 Duration is optional for YouTube videos - YouTube handles playback timing"
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Step 4: Content Options */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Coming Soon Feature */}
              <div className="bg-purple-900/20 border border-purple-500/30 p-6 rounded">
                <label className="flex items-start gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_coming_soon"
                    checked={formData.is_coming_soon}
                    onChange={handleChange}
                    className="w-5 h-5 text-purple-600 bg-gray-600 border-gray-500 rounded focus:ring-purple-500 mt-1"
                  />
                  <div className="flex-1">
                    <span className="text-white font-semibold flex items-center gap-2 mb-2">
                      <span className="text-xl">🎬</span>
                      Mark as "Coming Soon"
                    </span>
                    <p className="text-gray-400 text-sm mb-4">
                      Content will appear in "Coming Soon" section. Video upload becomes optional, only thumbnail required.
                    </p>
                    {formData.is_coming_soon && (
                      <div>
                        <label className="block text-white mb-2">Expected Release Date</label>
                        <input
                          type="date"
                          name="expected_release_date"
                          value={formData.expected_release_date || ''}
                          onChange={handleChange}
                          className="w-full max-w-md bg-gray-700 text-white px-4 py-2 rounded"
                        />
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Upload Method Summary */}
              <div className="bg-gray-700/50 p-6 rounded">
                <h3 className="text-white font-semibold mb-4">📋 Upload Method Summary</h3>
                <div className="flex items-center gap-3">
                  {formData.is_public_domain ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <span className="text-xl">✅</span>
                      <span>Local Video Upload Selected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-400">
                      <span className="text-xl">🎬</span>
                      <span>YouTube Embed URL Selected</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  {formData.is_public_domain 
                    ? "You chose to upload a local video file. Make sure to upload your video in Step 2."
                    : "You chose to use YouTube embed URL. Make sure to provide the embed URL in Step 2."
                  }
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="bg-gray-700/50 p-6 rounded">
                <h3 className="text-white font-semibold mb-4">Review Your Content</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-gray-300 font-medium mb-2">Basic Information</h4>
                    <p className="text-sm text-gray-400 mb-1"><strong>Type:</strong> {formData.content_type}</p>
                    <p className="text-sm text-gray-400 mb-1"><strong>Title:</strong> {formData.title}</p>
                    <p className="text-sm text-gray-400 mb-1"><strong>Genre:</strong> {formData.genre}</p>
                    <p className="text-sm text-gray-400"><strong>Release Date:</strong> {formData.release_date}</p>
                  </div>
                  <div>
                    <h4 className="text-gray-300 font-medium mb-2">Content Details</h4>
                    <p className="text-sm text-gray-400 mb-1"><strong>Rating:</strong> {formData.rating || 'Not set'}</p>
                    <p className="text-sm text-gray-400 mb-1"><strong>Duration:</strong> {formData.duration ? `${Math.floor(formData.duration / 60)}m ${formData.duration % 60}s` : 'Not set'}</p>
                    <p className="text-sm text-gray-400 mb-1"><strong>Coming Soon:</strong> {formData.is_coming_soon ? 'Yes' : 'No'}</p>
                    <p className="text-sm text-gray-400"><strong>Storage:</strong> {formData.is_public_domain ? 'Local Upload' : 'YouTube Embed'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-gray-300 font-medium mb-2">Files</h4>
                  <p className="text-sm text-gray-400 mb-1"><strong>Video:</strong> {files.video_file ? files.video_file.name : formData.youtube_trailer_url || 'None'}</p>
                  <p className="text-sm text-gray-400"><strong>Thumbnail:</strong> {files.thumbnail ? files.thumbnail.name : 'None'}</p>
                </div>
              </div>

              {/* Approval Notice */}
              <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-yellow-400 font-semibold mb-1">Approval Required</p>
                    <p className="text-gray-300 text-sm">
                      This content will be submitted for approval. Only SuperAdmin can approve content to make it visible to users.
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
                  disabled={loading || !validateStep(5)}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Submit Video'}
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
