'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Video,
  Film,
  Music,
  BarChart3,
  MessageSquare,
  LogOut,
  User,
  Clock,
  Tag,
} from 'lucide-react';

const menuItems = [
  { href: '/admin-dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin-dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin-dashboard/videos', icon: Video, label: 'Videos' },
  { href: '/admin-dashboard/episodes', icon: Film, label: 'Episodes' },
  { href: '/admin-dashboard/coming-soon', icon: Clock, label: 'Coming Soon' },
  { href: '/admin-dashboard/music', icon: Music, label: 'Music' },
  { href: '/admin-dashboard/genres', icon: Tag, label: 'Genres' },
  { href: '/admin-dashboard/feedback', icon: MessageSquare, label: 'Feedback' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [username, setUsername] = useState('Admin');

  useEffect(() => {
    const stored = localStorage.getItem('username') || localStorage.getItem('email');
    if (stored) setUsername(stored);
  }, []);

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 h-screen flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <Link href="/admin-dashboard" className="flex flex-col items-start px-5 py-4 border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
        <img src="/logo.png" alt="StreamVerse" className="h-9" />
        <p className="text-gray-500 text-xs mt-1">Admin Panel</p>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Menu</p>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${active
                    ? 'bg-red-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + Logout */}
      <div className="border-t border-gray-800 px-3 py-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/50">
          <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">{username}</p>
            <p className="text-gray-500 text-xs">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors text-sm"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
