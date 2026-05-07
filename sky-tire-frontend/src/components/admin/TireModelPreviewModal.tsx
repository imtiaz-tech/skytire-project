'use client';

import React, { useState } from 'react';
import { X, Pencil, ArrowLeft, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { TireModel } from '@/redux/types/tireModelTypes';

interface TireModelPreviewModalProps {
  open: boolean;
  onClose: () => void;
  model: TireModel | null;
}

export default function TireModelPreviewModal({ open, onClose, model }: TireModelPreviewModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!open || !model) return null;

  const getImageUrl = (path: string) => {
    if (!path) return '';
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
    const cleanPath = path.startsWith('uploads/') ? path.replace('uploads/', '') : path;
    return `${baseUrl}/uploads/${cleanPath}`;
  };

  const nextImage = () => {
    if (model.images && model.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % model.images.length);
    }
  };

  const prevImage = () => {
    if (model.images && model.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + model.images.length) % model.images.length);
    }
  };

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-gray-50 last:border-0">
      <span className="text-[14px] font-bold text-gray-400 uppercase tracking-wider w-48 shrink-0 mb-1 sm:mb-0">
        {label}
      </span>
      <div className="text-[16px] font-medium text-[#1e2a4a] flex-1">
        {value || <span className="text-gray-300 italic">Not specified</span>}
      </div>
    </div>
  );

  let parsedKeywords: string[] = [];
  if (model.keywords) {
    try {
      parsedKeywords = model.keywords.startsWith('[') 
        ? JSON.parse(model.keywords) 
        : model.keywords.split(',').map(k => k.trim()).filter(Boolean);
    } catch (e) {
      parsedKeywords = model.keywords.split(',').map(k => k.trim()).filter(Boolean);
    }
  }

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
          <h2 className="text-[22px] font-bold text-[#1e2a4a]">Tire Model Preview</h2>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/tire-models/edit/${model.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#1e2a4a] hover:bg-gray-50 transition-all shadow-sm"
            >
              <Pencil className="h-4 w-4" />
              Edit Model
            </Link>
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
          <div className="max-w-4xl mx-auto space-y-10">
            
            {/* Header Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                  {model.brand?.brandName || 'Unknown Brand'}
                </span>
                <span className={`px-3 py-1 text-[13px] font-bold uppercase tracking-wider rounded-lg ${
                  model.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {model.status || 'active'}
                </span>
              </div>
              <h1 className="text-[36px] sm:text-[42px] font-black text-[#1e2a4a] leading-tight tracking-tight">
                {model.modelName}
              </h1>
            </div>

            {/* Images Gallery */}
            {model.images && model.images.length > 0 && (
              <div className="relative aspect-[21/9] w-full rounded-3xl overflow-hidden shadow-lg border border-gray-100 bg-gray-50">
                <img 
                  src={getImageUrl(model.images[currentImageIndex])} 
                  alt={`${model.modelName} - Image ${currentImageIndex + 1}`} 
                  className="w-full h-full object-contain"
                />
                
                {model.images.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 text-[#1e2a4a] rounded-full hover:bg-white shadow-lg transition-all"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 text-[#1e2a4a] rounded-full hover:bg-white shadow-lg transition-all"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/50 rounded-full backdrop-blur-sm">
                      {model.images.map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} 
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Specifications Grid */}
            <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50">
                <h3 className="text-[18px] font-bold text-[#1e2a4a]">Technical Specifications</h3>
              </div>
              <div className="px-8 py-2">
                <InfoRow label="Vehicle Type" value={model.vehicleType} />
                <InfoRow label="Season" value={model.season} />
                <InfoRow label="Performance" value={model.performance} />
                <InfoRow label="Tread Design" value={model.treadDesign} />
                <InfoRow label="Warranty" value={model.warranty} />
                <InfoRow label="UTQG" value={model.utqg} />
                <InfoRow label="Tread Life" value={model.treadLife} />
                <InfoRow 
                  label="Features" 
                  value={
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5">
                        {model.runFlat ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-gray-300" />}
                        <span className={model.runFlat ? 'text-[#1e2a4a]' : 'text-gray-400'}>Run Flat</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {model.threePMS ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-gray-300" />}
                        <span className={model.threePMS ? 'text-[#1e2a4a]' : 'text-gray-400'}>Three PMS</span>
                      </div>
                    </div>
                  } 
                />
              </div>
            </div>

            {/* Description */}
            {model.description && (
              <div className="space-y-4">
                <h3 className="text-[18px] font-bold text-[#1e2a4a] px-2">Description</h3>
                <div className="p-8 bg-white border border-gray-100 rounded-[32px] shadow-sm relative">
                  <div 
                    className="prose prose-lg max-w-none text-gray-600 prose-headings:text-[#1e2a4a] prose-headings:font-black"
                    dangerouslySetInnerHTML={{ __html: model.description }}
                  />
                </div>
              </div>
            )}

            {/* SEO Information */}
            <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50">
                <h3 className="text-[18px] font-bold text-[#1e2a4a]">SEO Metadata</h3>
              </div>
              <div className="px-8 py-2">
                <InfoRow label="SEO Title" value={model.seoTitle} />
                <InfoRow label="Meta Description" value={model.metaDesc} />
                <InfoRow 
                  label="Keywords" 
                  value={
                    parsedKeywords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {parsedKeywords.map((keyword, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-gray-50 border border-gray-100 text-gray-600 text-[13px] font-bold rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    ) : null
                  } 
                />
              </div>
            </div>

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
