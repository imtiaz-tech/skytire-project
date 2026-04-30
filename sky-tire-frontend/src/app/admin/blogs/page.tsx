'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchBlogs, deleteBlog } from '@/redux/slices/blogsSlice';
import { Plus, Edit2, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
import { BlogStatus, Blog } from '@/redux/types/blogTypes';

export default function BlogsPage() {
  const dispatch = useAppDispatch();
  const { blogs, loading } = useAppSelector((state) => state.blogs);

  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchBlogs(statusFilter || undefined));
  }, [dispatch, statusFilter]);

  const handleDelete = async () => {
    if (!selectedBlog) return;
    setIsSubmitting(true);
    try {
      await dispatch(deleteBlog(selectedBlog.id)).unwrap();
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to delete blog');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
    const cleanPath = path.startsWith('uploads/') ? path.replace('uploads/', '') : path;
    return `${baseUrl}/uploads/${cleanPath}`;
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1e2a4a]">Blogs</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/blogs"
            className={`px-6 py-2.5 rounded-xl transition-all font-medium ${!statusFilter ? 'bg-[#1e2a4a] text-white' : 'bg-gray-100 text-[#1e2a4a] hover:bg-gray-200'}`}
          >
            All Posts
          </Link>
          <Link
            href="/admin/blogs?status=draft"
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-medium ${statusFilter === 'draft' ? 'bg-[#1e2a4a] text-white' : 'bg-gray-100 text-[#1e2a4a] hover:bg-gray-200'}`}
          >
            <Edit2 className="h-4 w-4" />
            Drafts
          </Link>
          <Link
            href="/admin/blogs/add"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-medium shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Post
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4 max-w-sm">
        <input
          type="text"
          placeholder="Search ..."
          className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
        />
        <button className="px-6 py-2.5 bg-[#1e2a4a] text-white rounded-xl font-medium">
          Search
        </button>
      </div>

      {loading && !blogs.length ? (
        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {blogs.map((blog) => (
            <div key={blog.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 relative group flex flex-col">
              <div className="relative aspect-video overflow-hidden bg-gray-100">
                <img src={getImageUrl(blog.featuredImage)} alt={blog.blogTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                
                {blog.isFeatured && (
                  <span className="absolute top-4 left-4 px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">
                    Featured
                  </span>
                )}

                <div className="absolute top-4 right-4 flex gap-2">
                  <Link href={`/admin/blogs/edit/${blog.id}`} className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all">
                    <Edit2 className="h-4 w-4" />
                  </Link>
                </div>

                <div className="absolute bottom-4 left-4 right-4 space-y-2">
                  <div className="flex items-center gap-2 text-white/80 text-xs font-medium">
                    <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {blog.blogStatus === BlogStatus.PUBLISHED ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {blog.blogStatus}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">
                    {blog.blogTitle}
                  </h3>
                </div>
              </div>

              <div className="p-4 bg-gray-50 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedBlog(blog);
                    setIsDeleteModalOpen(true);
                  }}
                  className="p-2.5 bg-white text-gray-400 hover:text-red-500 rounded-full shadow-sm hover:shadow transition-all"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
          {blogs.length === 0 && (
            <div className="col-span-full p-8 text-center text-gray-500">No blogs found.</div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedBlog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
              <Trash2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1e2a4a] mb-2">Delete Blog?</h2>
              <p className="text-gray-500">Are you sure you want to delete this blog? This action cannot be undone.</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 px-6 py-4 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 flex justify-center items-center gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
