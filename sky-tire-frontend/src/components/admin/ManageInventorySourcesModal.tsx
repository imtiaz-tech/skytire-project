'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { 
  fetchInventorySources, 
  createInventorySource, 
  updateInventorySource, 
  deleteInventorySource 
} from '@/redux/slices/inventorySourcesSlice';
import { X, Pencil, Trash, Loader2, Plus } from 'lucide-react';
import ConfirmModal from '@/components/common/ConfirmModal';

interface ManageInventorySourcesModalProps {
  onClose: () => void;
}

export default function ManageInventorySourcesModal({ onClose }: ManageInventorySourcesModalProps) {
  const dispatch = useAppDispatch();
  const { sources, loading } = useAppSelector((state) => state.inventorySources);

  const [newSourceName, setNewSourceName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchInventorySources());
  }, [dispatch]);

  const handleAdd = async () => {
    if (!newSourceName.trim()) return;
    setIsSubmitting(true);
    try {
      await dispatch(createInventorySource(newSourceName)).unwrap();
      setNewSourceName('');
    } catch (error: any) {
      alert(error.message || 'Failed to add source');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    setIsSubmitting(true);
    try {
      await dispatch(updateInventorySource({ id, source: editingName })).unwrap();
      setEditingId(null);
    } catch (error: any) {
      alert(error.message || 'Failed to update source');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsSubmitting(true);
    try {
      await dispatch(deleteInventorySource(deleteConfirmId)).unwrap();
      setDeleteConfirmId(null);
    } catch (error: any) {
      alert(error.message || 'Failed to delete source');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm lg:pl-[280px]">
      <div className="bg-white rounded-xl w-full max-w-[600px] shadow-2xl flex flex-col max-h-[85vh]">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[22px] font-bold text-[#1e2a4a]">Manage Inventory Sources</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Add New Source */}
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="New Source Name"
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[#1e2a4a]"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={!newSourceName.trim() || isSubmitting}
              className="px-6 py-3 bg-[#e8edf5] text-[#3B5998] font-medium rounded-lg hover:bg-[#d8e0ee] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>

          {/* List Sources */}
          <div className="space-y-1">
            {loading && sources.length === 0 ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : (
              sources.map((source) => (
                <div key={source.id} className="flex items-center justify-between py-3 px-2 group hover:bg-gray-50 rounded-lg transition-colors">
                  {editingId === source.id ? (
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-4 py-2 border border-blue-500 rounded-lg text-[15px] focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(source.id)}
                      />
                      <button 
                        onClick={() => handleSaveEdit(source.id)}
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
                      <span className="text-[16px] text-[#1e2a4a]">{source.source}</span>
                      <div className="flex items-center gap-4 transition-opacity">
                        <button 
                          onClick={() => { setEditingId(source.id); setEditingName(source.source); }}
                          className="text-[#3B5998] hover:text-[#2a3b69]"
                        >
                          <Pencil className="h-[18px] w-[18px]" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(source.id)}
                          className="text-[#ff5a5f] hover:text-red-600"
                        >
                          <Trash className="h-[18px] w-[18px]" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
            {sources.length === 0 && !loading && (
              <p className="text-gray-400 text-center py-4">No sources found.</p>
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

      <ConfirmModal
        open={!!deleteConfirmId}
        title="Delete Inventory Source"
        message="Are you sure you want to delete this inventory source? This will affect any tires currently using it."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
