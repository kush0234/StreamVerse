export default function EmptyState({ message = 'No data found', icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-gray-800 rounded-lg border border-gray-700">
      {Icon && <Icon size={40} className="text-gray-600 mb-3" />}
      <p className="text-gray-400 text-lg">{message}</p>
    </div>
  );
}
