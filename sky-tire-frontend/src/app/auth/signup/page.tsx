'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { signupUser } from '@/redux/slices/authSlice';
import { getRoleRedirectPath } from '@/lib/roleRedirect';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const isLengthValid = formData.password.length >= 12;
  const isUppercaseValid = /[A-Z]/.test(formData.password);
  const isNumOrSpecialValid = /[0-9!@#$%^&*_=+\-\\]/.test(formData.password);
  const isPasswordValid = isLengthValid && isUppercaseValid && isNumOrSpecialValid;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;
    try {
      const result = await dispatch(signupUser(formData)).unwrap();
      const redirectPath = getRoleRedirectPath(result.user);
      router.push(redirectPath);
    } catch (err: any) {
      console.error('Signup failed with error:', err);
    }
  };

  const ValidationItem = ({ isValid, text }: { isValid: boolean, text: string }) => (
    <div className={`flex items-center space-x-2 text-sm ${isValid ? 'text-green-500' : 'text-zinc-500'}`}>
      <CheckCircle2 className={`h-4 w-4 ${isValid ? 'text-green-500' : 'text-zinc-600'}`} />
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Join SkyTire for premium wheel & tire packages
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}
          
          <div className="relative">
            <UserIcon className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
            <input
              name="name"
              type="text"
              required
              className="block w-full pl-10 pr-3 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-geist-sans"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
            <input
              name="email"
              type="email"
              required
              className="block w-full pl-10 pr-3 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-geist-sans"
              placeholder="Email address"
              value={formData.email}
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
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="space-y-2 mt-2 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
            <ValidationItem isValid={isLengthValid} text="Minimum 12 characters" />
            <ValidationItem isValid={isUppercaseValid} text="1 uppercase letter" />
            <ValidationItem isValid={isNumOrSpecialValid} text="1 number or 1 special character" />
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordValid}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
              SignIn here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
