'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { Tire, ShieldAlert } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Only verify auth once hydration/loading is complete
    if (!loading) {
      if (!isAuthenticated || user?.role !== 'ADMIN') {
        router.push('/auth/login');
      }
    }
  }, [user, isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Tire className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Double check authorization before rendering children
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-white">Access Denied</h1>
          <p className="text-zinc-400">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-6">
        <div className="flex items-center space-x-2">
          <Tire className="h-6 w-6 text-blue-500" />
          <span className="text-white font-bold tracking-tight">SkyTire Admin</span>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
