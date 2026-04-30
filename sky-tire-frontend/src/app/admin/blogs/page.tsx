'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchBlogs, deleteBlog } from '@/redux/slices/blogsSlice';
import { Plus, Edit2, Trash2, Loader2, Eye, User, ArrowLeft, Search } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import { BlogStatus, Blog } from '@/redux/types/blogTypes';

export default function BlogsPage() {
  const dispatch = useAppDispatch();
  const { blogs, loading } = useAppSelector((state) => state.blogs);

  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { totalPages } = useAppSelector((state) => state.blogs);

  useEffect(() => {
    const status = statusFilter ? statusFilter.toUpperCase() : 'PUBLISHED';
    dispatch(fetchBlogs({ 
      status, 
      page: currentPage, 
      search: searchQuery || undefined 
    }));
  }, [dispatch, statusFilter, currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    const status = statusFilter ? statusFilter.toUpperCase() : 'PUBLISHED';
    dispatch(fetchBlogs({ 
      status, 
      page: 1, 
      search: searchQuery || undefined 
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
  }, [statusFilter]);

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
    <div className="p-8 space-y-8 bg-white min-h-screen">
      <div className="flex justify-between items-center">
        {statusFilter === 'draft' ? (
          <div className="flex items-center gap-4">
            <Link href="/admin/blogs" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="h-6 w-6 text-[#1e2a4a]" />
            </Link>
            <h1 className="text-[32px] font-bold text-[#1e2a4a]">Drafts</h1>
          </div>
        ) : (
          <>
            <h1 className="text-[32px] font-bold text-[#1e2a4a]">Blogs</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/blogs?status=draft"
                className="flex items-center gap-2 px-6 py-2.5 bg-[#1e2a4a] text-white rounded-xl hover:bg-[#2a3b69] transition-all font-medium"
              >
                <Edit2 className="h-4 w-4" />
                Drafts
              </Link>
              <Link
                href="/admin/blogs/add"
                className="flex items-center gap-2 px-6 py-2.5 bg-[#1e2a4a] text-white rounded-xl hover:bg-[#2a3b69] transition-all font-medium"
              >
                <Plus className="h-4 w-4" />
                New Post
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500/50 outline-none text-[15px]"
          />
        </div>
        <button 
          onClick={handleSearch}
          className="px-8 py-3 bg-[#1e2a4a] text-white rounded-xl font-bold hover:bg-[#2a3b69] transition-colors"
        >
          Search
        </button>
      </div>

      {loading && !blogs.length ? (
        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {blogs.map((blog) => (
            <div key={blog.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 relative group aspect-[4/3] flex flex-col">
              <div className="absolute inset-0 z-0">
                <img src={getImageUrl(blog.featuredImage)} alt={blog.blogTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors"></div>
              </div>
              
              <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[#1e2a4a]">
                      <Eye className="h-5 w-5" />
                    </div>
                    {/* <Link href={`/admin/blogs/edit/${blog.id}`} className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[#1e2a4a] hover:bg-white transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </Link> */}
                    <Link
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 cursor-not-allowed opacity-60 pointer-events-none"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-white/70 text-[13px] font-medium uppercase tracking-wider">
                    {new Date(blog.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <h3 className="text-white font-bold text-[18px] leading-snug line-clamp-2">
                    {blog.blogTitle}
                  </h3>
                </div>

                <div className="absolute bottom-6 right-6">
                  <button
                    onClick={() => {
                      setSelectedBlog(blog);
                      setIsDeleteModalOpen(true);
                    }}
                    className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[#1e2a4a] hover:text-red-500 hover:bg-white transition-all shadow-sm"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {blogs.length === 0 && (
            <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
              <p className="text-[18px] font-bold text-[#1e2a4a]">No blogs available at the moment.</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && blogs.length > 0 && totalPages > 1 && (
        <div className="mt-8 px-8 py-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between rounded-b-3xl">
          <div className="text-sm font-medium text-gray-400">
            Page <span className="text-[#1e2a4a] font-bold">{currentPage}</span> of{' '}
            <span className="text-[#1e2a4a] font-bold">{totalPages}</span>
          </div>
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={handlePageChange} 
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={isDeleteModalOpen}
        title="Confirm Delete"
        message="Are you sure you want to delete this blog? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
