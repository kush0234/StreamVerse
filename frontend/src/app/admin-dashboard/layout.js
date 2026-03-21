'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { ToastProvider } from '@/context/ToastContext';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('access_token');

    if (!token || role !== 'ADMIN') {
      router.push('/login');
    } else {
      setIsAdmin(true);
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
          <p className="text-gray-400 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-950 flex">
        <AdminSidebar />
        <main className="flex-1 ml-64 min-h-screen overflow-y-auto">
          <div className="p-6 max-w-screen-2xl">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
