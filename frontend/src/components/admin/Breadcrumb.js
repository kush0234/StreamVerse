'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ items }) {
  // items: [{ label, href? }, ...]  — last item has no href (current page)
  return (
    <nav className="flex items-center gap-1 text-sm mb-4 flex-wrap">
      <Link href="/admin-dashboard" className="text-gray-500 hover:text-white transition-colors flex items-center gap-1">
        <Home size={13} />
        Dashboard
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight size={13} className="text-gray-600" />
          {item.href ? (
            <Link href={item.href} className="text-gray-500 hover:text-white transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-300">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
