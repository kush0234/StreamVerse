export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4" />
      <p className="text-gray-400">{message}</p>
    </div>
  );
}
