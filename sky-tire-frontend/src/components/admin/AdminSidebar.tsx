'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/redux/hooks';
import {
  LayoutDashboard,
  Users,
  UserRound,
  CircleDot,
  Disc3,
  Wrench,
  Star,
  Package,
  Ticket,
  Megaphone,
  RotateCw,
  Image,
  ChevronLeft,
  FileText,
  Tags,
  Cpu,
  Database,
  Truck,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Members', href: '/admin/users', icon: Users },
  { label: 'Guest User', href: '/admin/guest-users', icon: UserRound },
  { label: 'Wheels', href: '/admin/wheels', icon: Disc3 },
  { label: 'Wire Wheels', href: '/admin/wire-wheels', icon: Disc3 },
  { label: 'Bolt-On Wire Wheels', href: '/admin/bolt-on-wire-wheels', icon: Disc3 },
  { label: 'Accessories', href: '/admin/accessories', icon: Wrench },
  { label: 'Shipping', href: '/admin/shipping', icon: Truck },
  { label: 'Brands', href: '/admin/brands', icon: Star },
  { label: 'Tires', href: '/admin/tires', icon: CircleDot },
  { label: 'Tires Models', href: '/admin/tire-models', icon: Tags },
  { label: 'Inventory Sources', href: '/admin/inventory-sources', icon: Database },
  { label: 'Orders', href: '/admin/orders', icon: Package },
  { label: 'Coupons', href: '/admin/coupons', icon: Ticket },
  { label: 'Promo Bars', href: '/admin/promo-bars', icon: Megaphone },
  { label: 'Rotator', href: '/admin/rotator', icon: RotateCw },
  { label: 'Banners', href: '/admin/banner', icon: Image },
  { label: 'Blogs', href: '/admin/blogs', icon: FileText },
  { label: 'AI Prompts', href: '/admin/ai-prompts', icon: Cpu },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initial = user?.name?.charAt(0).toUpperCase() || 'A';
  const name = user?.name || 'Admin User';
  const role = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()) : 'Admin';

  return (
    <aside className={`sticky top-0 z-50 flex h-screen flex-shrink-0 flex-col border-r border-gray-100 bg-white transition-all duration-300 ${isCollapsed ? 'w-[80px]' : 'w-[280px]'}`}>
      {/* Logo */}
      <Link
        href="/"
        className={`flex items-center gap-2 px-5 pt-5 pb-4 cursor-pointer hover:opacity-80 transition-opacity ${isCollapsed ? 'justify-center px-0' : ''}`}
      >
        <div className="flex items-center gap-1.5">
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" fill="#E8EDF5" />
            <circle cx="20" cy="20" r="12" fill="#C5D0E6" />
            <circle cx="20" cy="20" r="6" fill="#3B5998" />
            <path d="M10 30 Q20 10 30 30" stroke="#3B5998" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>

          {!isCollapsed && (
            <div className="animate-in fade-in duration-300">
              <span className="text-[15px] font-bold tracking-tight text-[#1e2a4a]">
                SKY TIRE
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* User Info */}
      <div className={`mx-3 mb-4 flex items-center gap-3 rounded-xl bg-[#e9edf5] py-2.5 transition-all hover:bg-[#dfe5f0] ${isCollapsed ? 'justify-center px-0 mx-2' : 'px-3'}`}>
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#3B5998] text-sm font-semibold text-white shadow-sm">
          {initial}
        </div>
        {!isCollapsed && (
          <div className="leading-tight overflow-hidden animate-in fade-in duration-300">
            <p className="text-[13px] font-semibold text-[#1e2a4a] truncate" title={name}>
              {name}
            </p>
            <p className="text-[11px] text-gray-400 capitalize">{role.toLowerCase()}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl py-2.5 text-[15.5px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#3B5998] text-white shadow-sm shadow-blue-200'
                  : 'text-[#3B5998] hover:bg-[#f0f3f9]'
              } ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${isActive ? 'text-white' : 'text-[#8896b3]'}`} />
              {!isCollapsed && <span className="animate-in fade-in duration-300">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div className={`py-4 transition-all duration-300 ${isCollapsed ? 'px-0 flex justify-center' : 'px-5'}`}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex h-9 w-9 items-center justify-center rounded-full bg-[#3B5998] text-white shadow-md transition-all hover:scale-105 active:scale-95 ${isCollapsed ? 'rotate-180' : ''}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
