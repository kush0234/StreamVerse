'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="bg-black">
      <AdminSidebar />
      <main className="ml-64 p-6">
        {children}
      </main>
    </div>
  );
}
