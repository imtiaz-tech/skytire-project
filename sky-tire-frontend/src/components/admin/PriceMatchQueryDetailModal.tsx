'use client';

import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { PriceMatchQuery } from '@/redux/types/priceMatchQueryTypes';
import { getUploadImageUrl } from '@/lib/uploadImageUrl';
import { roundCurrency } from '@/utils/pricing';

interface PriceMatchQueryDetailModalProps {
  open: boolean;
  onClose: () => void;
  query: PriceMatchQuery | null;
  loading?: boolean;
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-bold text-gray-500 mb-1">{label}</p>
      <div className="text-[15px] font-medium text-[#1e2a4a]">{value}</div>
    </div>
  );
}

export default function PriceMatchQueryDetailModal({
  open,
  onClose,
  query,
  loading = false,
}: PriceMatchQueryDetailModalProps) {
  if (!open) return null;

  const images = query?.product?.images?.filter(Boolean) ?? [];
  const displayImages = images.length > 0 ? images.slice(0, 4) : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:pl-[280px]">
      <div
        className="absolute inset-0 bg-[#1e2a4a]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-[#1e2a4a]">Price Match Query Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-[#1e2a4a] text-white rounded-lg hover:bg-opacity-90 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#1e2a4a]" />
            </div>
          ) : !query ? (
            <p className="text-center text-gray-500 py-20">Query not found.</p>
          ) : (
            <>
              {displayImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {displayImages.map((img, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl border border-gray-100 overflow-hidden bg-gray-50"
                    >
                      <img
                        src={getUploadImageUrl(img)}
                        alt={`Product ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              <section>
                <h3 className="text-lg font-bold text-[#1e2a4a] mb-4">Product Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InfoField
                    label="Product Name"
                    value={query.product?.productName ?? '—'}
                  />
                  <InfoField
                    label="Brand"
                    value={query.product?.brandName ?? '—'}
                  />
                  <InfoField
                    label="Model"
                    value={query.product?.modelName ?? '—'}
                  />
                  <InfoField
                    label="Tire Size"
                    value={query.product?.tireSize ?? '—'}
                  />
                  <InfoField
                    label="Sale Price"
                    value={
                      query.product ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-red-50 text-red-600 font-bold">
                          $ {roundCurrency(query.product.salePrice).toFixed(2)}
                        </span>
                      ) : (
                        '—'
                      )
                    }
                  />
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#1e2a4a] mb-4">Competitor Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InfoField label="Competitor Name" value={query.competitor} />
                  <InfoField
                    label="URL"
                    value={
                      <a
                        href={query.competitorURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        See Competitor&apos;s Product
                      </a>
                    }
                  />
                  <InfoField
                    label="Competitor Price"
                    value={
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-green-50 text-green-700 font-bold">
                        $ {query.competitorPrice}
                      </span>
                    }
                  />
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#1e2a4a] mb-4">User Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InfoField label="Full Name" value={query.fullName} />
                  <InfoField label="Email" value={query.email} />
                  <InfoField label="Phone" value={query.phone} />
                  <InfoField label="Zip Code" value={query.zipCode} />
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
