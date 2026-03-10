'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Video,
  Film,
  Music,
  BarChart3,
  MessageSquare,
  LogOut
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/admin-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin-dashboard/videos', icon: Video, label: 'Videos' },
    { href: '/admin-dashboard/episodes', icon: Film, label: 'Episodes' },
    { href: '/admin-dashboard/music', icon: Music, label: 'Music' },
    { href: '/admin-dashboard/feedback', icon: MessageSquare, label: 'Feedback' },
    { href: '/admin-dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-gray-900 h-screen p-4 flex flex-col fixed left-0 top-0 overflow-hidden">
      <Link href="/admin-dashboard" className="mb-8 block hover:scale-105 cursor-pointer transition-transform flex-shrink-0">
        <img
          src="/logo.png"
          alt="StreamVerse Logo"
          className="h-8 md:h-10"
        />
        <p className="text-gray-400 text-sm">Admin Panel</p>
      </Link>

      <nav className="flex-1 overflow-hidden">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                    }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors mt-4"
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </aside>
  );
}
