'use client';

import React from 'react';
import { X, Pencil, ExternalLink, Calendar, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { Blog } from '@/redux/types/blogTypes';

interface BlogPreviewModalProps {
  open: boolean;
  onClose: () => void;
  blog: Blog | null;
}

export default function BlogPreviewModal({ open, onClose, blog }: BlogPreviewModalProps) {
  if (!open || !blog) return null;

  const getImageUrl = (path: string) => {
    if (!path) return '';
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
    const cleanPath = path.startsWith('uploads/') ? path.replace('uploads/', '') : path;
    return `${baseUrl}/uploads/${cleanPath}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:pl-[280px]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1e2a4a]/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-5xl rounded-[32px] shadow-2xl shadow-blue-900/10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-20">
          <h2 className="text-[22px] font-bold text-[#1e2a4a]">Blog Preview</h2>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/blogs/edit/${blog.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#1e2a4a] hover:bg-gray-50 transition-all shadow-sm"
            >
              <Pencil className="h-4 w-4" />
              Edit Blog
            </Link>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#1e2a4a] hover:bg-gray-50 transition-all shadow-sm"
            >
              <ExternalLink className="h-4 w-4" />
              View on Website
            </button>
            <button 
              onClick={onClose}
              className="p-2.5 bg-[#1e2a4a] text-white rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-blue-900/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Featured Image */}
            <div className="relative aspect-[21/9] w-full rounded-3xl overflow-hidden shadow-lg border border-gray-100">
              <img 
                src={getImageUrl(blog.featuredImage)} 
                alt={blog.blogTitle} 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title and Metadata */}
            <div className="space-y-4">
              <h1 className="text-[36px] sm:text-[42px] font-black text-[#1e2a4a] leading-tight tracking-tight">
                {blog.blogTitle}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-[15px] font-medium text-gray-500">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <User className="h-4 w-4" />
                  </div>
                  <span>Author: <span className="text-[#1e2a4a] font-bold">{blog.authorName || blog.author?.name || 'Admin'}</span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span>Reading Time: <span className="text-[#1e2a4a] font-bold">{blog.readingTime} min read</span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="text-[#1e2a4a] font-bold">{formatDate(blog.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Main Content Body */}
            <div className="p-8 sm:p-10 bg-white border border-gray-100 rounded-[32px] shadow-sm relative">
              <div 
                className="prose prose-lg max-w-none text-[#1e2a4a] prose-headings:text-[#1e2a4a] prose-headings:font-black prose-p:leading-relaxed prose-img:rounded-2xl"
                dangerouslySetInnerHTML={{ __html: blog.blogBody }}
              />
            </div>

            {/* Keywords */}
            {blog.keywords && blog.keywords.length > 0 && (
              <div className="space-y-4 pt-4">
                <h3 className="text-[18px] font-bold text-[#1e2a4a] flex items-center gap-2">
                   Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {blog.keywords.map((keyword, index) => (
                    <span 
                      key={index}
                      className="px-4 py-2 bg-gray-50 border border-gray-100 text-gray-600 text-[14px] font-bold rounded-full hover:bg-white transition-all shadow-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
