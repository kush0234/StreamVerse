/**
 * Upload progressbar component.
 * Shows during file upload and a "processing" state after 100% is reached.
 */
export default function UploadProgress({ progress, isProcessing }) {
    if (progress === null) return null;

    return (
        <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
                <span className="text-white font-medium">
                    {isProcessing
                        ? '⚙️ Processing on Cloudinary...'
                        : progress < 100
                            ? `☁️ Uploading... ${progress}%`
                            : '✅ Upload complete'}
                </span>
                {!isProcessing && (
                    <span className="text-gray-400">{progress}%</span>
                )}
            </div>

            <div className="w-full bg-gray-600 rounded-full h-3 overflow-hidden">
                <div
                    className={`h-3 rounded-full transition-all duration-300 ${isProcessing
                            ? 'bg-yellow-500 animate-pulse w-full'
                            : progress === 100
                                ? 'bg-green-500'
                                : 'bg-blue-500'
                        }`}
                    style={{ width: isProcessing ? '100%' : `${progress}%` }}
                />
            </div>

            {isProcessing && (
                <p className="text-gray-400 text-xs">
                    Cloudinary is processing your video. This may take a moment...
                </p>
            )}
        </div>
    );
}

