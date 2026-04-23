'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { loginUser } from '@/redux/slices/authSlice';
import { getRoleRedirectPath } from '@/lib/roleRedirect';
import { LogIn, Lock, User as UserIcon, Truck, Loader2, Eye, EyeOff } from 'lucide-react';
import { useFingerprint } from '@/hooks/useFingerprint';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const visitorId = useFingerprint();
  console.log("🚀 ~ LoginPage ~ visitorId:", visitorId)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = visitorId ? { ...formData, visitorId } : formData;
      const result = await dispatch(loginUser(payload)).unwrap();
      const redirectPath = getRoleRedirectPath(result.user);
      router.push(redirectPath);
    } catch (err: any) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-blue-600/10 p-3 rounded-xl border border-blue-500/20">
              <Truck className="h-10 w-10 text-blue-500" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to manage your precision packages
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <UserIcon className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                name="email"
                type="email"
                required
                className="block w-full pl-10 pr-3 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-geist-sans"
                placeholder="Email address"
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="block w-full pl-10 pr-10 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-geist-sans"
                placeholder="Password"
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/auth/forgot-password" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-500">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
