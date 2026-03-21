'use client';

import { useEffect, useState, useMemo } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Clock, Edit, RefreshCw, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyState from '@/components/admin/EmptyState';
import SearchBar from '@/components/admin/SearchBar';
import { useToast } from '@/context/ToastContext';

export default function ComingSoonManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await adminApi.getVideos();
      setItems(data.filter(v => v.is_coming_soon));
    } catch {
      toast.error('Failed to load coming soon content');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditDate(item.expected_release_date || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDate('');
  };

  const saveDate = async (id) => {
    setSaving(true);
    try {
      await adminApi.updateVideo(id, { expected_release_date: editDate || null });
      toast.success('Release date updated');
      setEditingId(null);
      fetchItems(true);
    } catch {
      toast.error('Failed to update release date');
    } finally {
      setSaving(false);
    }
  };

  const markReleased = async (id) => {
    try {
      await adminApi.updateVideo(id, { is_coming_soon: false });
      toast.success('Marked as released');
      fetchItems(true);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filtered = useMemo(() =>
    items.filter(v =>
      v.title?.toLowerCase().includes(search.toLowerCase()) ||
      v.genre?.toLowerCase().includes(search.toLowerCase())
    ), [items, search]);

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) return <LoadingSpinner message="Loading coming soon content..." />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Coming Soon</h1>
          <p className="text-gray-400 text-sm mt-0.5">{items.length} title{items.length !== 1 ? 's' : ''} scheduled</p>
        </div>
        <button
          onClick={() => fetchItems(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="w-full sm:w-72">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title or genre..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Clock} message={search ? `No results for "${search}"` : 'No coming soon content'} />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((item) => {
            const days = daysUntil(item.expected_release_date);
            return (
              <div key={item.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Thumbnail */}
                <div className="w-24 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-700">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Clock size={20} className="text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-medium truncate">{item.title}</p>
                    <span className="text-xs bg-purple-600/80 px-2 py-0.5 rounded text-white">Coming Soon</span>
                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">{item.content_type}</span>
                    {item.genre && <span className="text-xs text-gray-500">{item.genre}</span>}
                  </div>

                  {/* Release date row */}
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <CalendarDays size={14} className="text-gray-500 flex-shrink-0" />
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={editDate}
                          onChange={e => setEditDate(e.target.value)}
                          className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <button
                          onClick={() => saveDate(item.id)}
                          disabled={saving}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={cancelEdit} className="text-xs text-gray-400 hover:text-white">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {item.expected_release_date ? (
                          <>
                            <span className="text-gray-300 text-sm">
                              {new Date(item.expected_release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                            {days !== null && (
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                days < 0 ? 'bg-red-600/30 text-red-400' :
                                days <= 7 ? 'bg-yellow-600/30 text-yellow-400' :
                                'bg-blue-600/30 text-blue-400'
                              }`}>
                                {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d left`}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-500 text-sm italic">No date set</span>
                        )}
                        <button onClick={() => startEdit(item)} className="text-gray-500 hover:text-white transition-colors">
                          <Edit size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/admin-dashboard/videos/edit/${item.id}`}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => markReleased(item.id)}
                    className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Mark Released
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
