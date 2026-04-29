'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Package, ExternalLink } from 'lucide-react';
import api from '@/lib/api';

interface Product {
  id: number;
  name: string;
  image: string | null;
  sku: string | null;
  price: number | null;
  oldPrice?: number | null;
  stock: number | null;
}

interface BrandProductsModalProps {
  open: boolean;
  brandId: string;
  brandName: string;
  onClose: () => void;
}

export default function BrandProductsModal({ open, brandId, brandName, onClose }: BrandProductsModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    if (open && brandId) {
      fetchProducts();
    }
  }, [open, brandId]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/products/by-brand/${brandId}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch brand products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // Pagination logic
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedProducts = products.slice(startIndex, startIndex + itemsPerPage);

  const getImageUrl = (path: string | null) => {
    if (!path) return '/placeholder-tire.png';
    if (path.startsWith('http')) return path;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
    return `${baseUrl}/uploads/${path}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1e2a4a]/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl shadow-blue-900/10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-[#1e2a4a]">Brand Products</h2>
            <p className="text-sm text-gray-400 font-medium mt-0.5">Showing products for <span className="text-[#3B5998] font-bold">{brandName}</span></p>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 text-[#3B5998] animate-spin" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-sm">
                <Package className="h-10 w-10 text-gray-200" />
              </div>
              <h3 className="text-lg font-bold text-[#1e2a4a]">No products found</h3>
              <p className="text-gray-400 text-sm mt-1 max-w-xs">
                We couldn't find any products linked to this brand in our database.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedProducts.map((product) => (
                <div 
                  key={product.id}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-6 items-center"
                >
                  {/* Image */}
                  <div className="w-32 h-32 bg-gray-50 rounded-2xl p-2 flex items-center justify-center flex-shrink-0">
                    <img 
                      src={getImageUrl(product.image)} 
                      alt={product.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <h4 className="text-lg font-bold text-[#1e2a4a] leading-tight">
                      {product.name}
                    </h4>
                    <div className="flex items-center justify-center sm:justify-start gap-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-[#3B5998]">
                          ${product.price?.toFixed(2)}
                        </span>
                        {/* {product.oldPrice && (
                          <span className="text-sm font-bold text-red-500 line-through opacity-70">
                            ${product.oldPrice.toFixed(2)}
                          </span>
                        )} */}
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-400 text-[10px] font-bold uppercase rounded-lg tracking-wider">
                        SKU: {product.sku || 'N/A'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                      <button className="px-6 py-2 bg-[#1e2a4a] text-white rounded-xl text-xs font-bold hover:bg-[#2a3a5a] transition-all flex items-center gap-2">
                        View Details
                      </button>
                      <span className={`text-xs font-bold ${Number(product.stock) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {Number(product.stock) > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-6 border-t border-gray-100 bg-white flex justify-center">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 disabled:opacity-50 hover:bg-gray-100 transition-all font-bold"
              >
                &laquo;
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                    currentPage === i + 1 
                      ? 'bg-[#1e2a4a] text-white shadow-lg shadow-blue-100' 
                      : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 disabled:opacity-50 hover:bg-gray-100 transition-all font-bold"
              >
                &raquo;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
