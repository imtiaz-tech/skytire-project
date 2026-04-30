'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchBlogCategories, createBlogCategory, updateBlogCategory, deleteBlogCategory } from '@/redux/slices/blogCategoriesSlice';
import { Plus, Edit2, Trash2, Loader2, X } from 'lucide-react';
import { BlogCategory } from '@/redux/types/blogTypes';

export default function BlogCategoriesPage() {
  const dispatch = useAppDispatch();
  const { categories, loading } = useAppSelector((state) => state.blogCategories);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchBlogCategories());
  }, [dispatch]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().trim().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: selectedCategory ? prev.slug : generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (selectedCategory) {
        await dispatch(updateBlogCategory({ id: selectedCategory.id, data: formData })).unwrap();
      } else {
        await dispatch(createBlogCategory(formData)).unwrap();
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    setIsSubmitting(true);
    try {
      await dispatch(deleteBlogCategory(selectedCategory.id)).unwrap();
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1e2a4a]">Blog Categories</h1>
        <button
          onClick={() => {
            setSelectedCategory(null);
            setFormData({ name: '', slug: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#1e2a4a] text-white rounded-xl hover:bg-[#2a3b69] transition-all font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {loading && !categories.length ? (
        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-4 text-sm font-semibold text-gray-500">Name</th>
                <th className="p-4 text-sm font-semibold text-gray-500">Slug</th>
                <th className="p-4 text-sm font-semibold text-gray-500">Blogs Count</th>
                <th className="p-4 text-sm font-semibold text-gray-500 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-4 text-[#1e2a4a] font-medium">{category.name}</td>
                  <td className="p-4 text-gray-500">{category.slug}</td>
                  <td className="p-4 text-gray-500">{category._count?.blogs || 0}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedCategory(category);
                          setFormData({ name: category.name, slug: category.slug });
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No categories found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#1e2a4a]">
                {selectedCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider ml-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-5 py-4 bg-gray-50/50 border-none rounded-2xl text-[#1e2a4a] focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider ml-1">Slug</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50/50 border-none rounded-2xl text-[#1e2a4a] focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-white bg-[#3B5998] hover:bg-opacity-90 flex justify-center items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {selectedCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
              <Trash2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1e2a4a] mb-2">Delete Category?</h2>
              <p className="text-gray-500">Are you sure you want to delete "{selectedCategory.name}"? This action cannot be undone.</p>
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
