'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { 
  fetchBlogCategories, 
  createBlogCategory, 
  updateBlogCategory, 
  deleteBlogCategory 
} from '@/redux/slices/blogCategoriesSlice';
import { X, Edit2, Trash2, Loader2, Plus } from 'lucide-react';
import { BlogCategory } from '@/redux/types/blogTypes';

interface ManageCategoriesModalProps {
  onClose: () => void;
}

export default function ManageCategoriesModal({ onClose }: ManageCategoriesModalProps) {
  const dispatch = useAppDispatch();
  const { categories, loading } = useAppSelector((state) => state.blogCategories);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchBlogCategories());
  }, [dispatch]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().trim().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const handleAdd = async () => {
    if (!newCategoryName.trim()) return;
    setIsSubmitting(true);
    try {
      const slug = generateSlug(newCategoryName);
      await dispatch(createBlogCategory({ name: newCategoryName, slug })).unwrap();
      setNewCategoryName('');
    } catch (error: any) {
      alert(error.message || 'Failed to add category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    setIsSubmitting(true);
    try {
      const slug = generateSlug(editingName);
      await dispatch(updateBlogCategory({ id, data: { name: editingName, slug } })).unwrap();
      setEditingId(null);
    } catch (error: any) {
      alert(error.message || 'Failed to update category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    setIsSubmitting(true);
    try {
      await dispatch(deleteBlogCategory(id)).unwrap();
    } catch (error: any) {
      alert(error.message || 'Failed to delete category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm lg:pl-[280px]">
      <div className="bg-white rounded-xl w-full max-w-[600px] shadow-2xl flex flex-col max-h-[85vh]">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-[22px] font-bold text-[#1e2a4a]">Manage Blog Categories</h2>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Add New Category */}
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="New Category"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[#1e2a4a]"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={!newCategoryName.trim() || isSubmitting}
              className="px-6 py-3 bg-[#e8edf5] text-[#3B5998] font-medium rounded-lg hover:bg-[#d8e0ee] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>

          {/* List Categories */}
          <div className="space-y-1">
            {loading && categories.length === 0 ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between py-3 px-2 group hover:bg-gray-50 rounded-lg transition-colors">
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-4 py-2 border border-blue-500 rounded-lg text-[15px] focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(cat.id)}
                      />
                      <button 
                        onClick={() => handleSaveEdit(cat.id)}
                        className="px-5 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 text-[14px]"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 text-blue-500 font-medium text-[14px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-[16px] text-[#1e2a4a]">{cat.name}</span>
                      <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}
                          className="text-[#64748b] hover:text-[#3B5998]"
                        >
                          <Edit2 className="h-[18px] w-[18px] fill-current" />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id)}
                          className="text-[#64748b] hover:text-red-500"
                        >
                          <Trash2 className="h-[18px] w-[18px] fill-current" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
            {categories.length === 0 && !loading && (
              <p className="text-gray-400 text-center py-4">No categories found.</p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="text-blue-500 font-bold hover:text-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
