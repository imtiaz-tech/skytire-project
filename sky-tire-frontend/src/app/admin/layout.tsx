'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/redux/hooks';
import { CircleDot, ShieldAlert, Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, initialLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Wait for /auth/me to finish before making redirect decisions
    if (!initialLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else if (user?.role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [user, isAuthenticated, initialLoading, router]);

  // Show loading spinner while initial auth check is in progress
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          <p className="text-zinc-400 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin (briefly, before redirect kicks in)
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
          <CircleDot className="h-6 w-6 text-blue-500" />
          <span className="text-white font-bold tracking-tight">SkyTire Admin</span>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
