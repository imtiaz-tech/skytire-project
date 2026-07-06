'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2, Mail, Send } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PriceMatchQuery } from '@/redux/types/priceMatchQueryTypes';
import { getUploadImageUrl } from '@/lib/uploadImageUrl';
import { roundCurrency } from '@/utils/pricing';
import { getEmailTypoSuggestion } from '@/lib/emailValidation';

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
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const emailTypoSuggestion = recipientEmail ? getEmailTypoSuggestion(recipientEmail) : null;

  useEffect(() => {
    if (query) {
      setEmailSubject('');
      setEmailMessage('');
      setRecipientEmail(query.email);
    }
  }, [query?.id, query?.email]);

  if (!open) return null;

  const images = query?.product?.images?.filter(Boolean) ?? [];
  const displayImages = images.length > 0 ? images.slice(0, 4) : [];

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    const subject = emailSubject.trim();
    const message = emailMessage.trim();
    const to = recipientEmail.trim();

    if (!to) {
      toast.error('Recipient email is required');
      return;
    }
    if (!subject) {
      toast.error('Please enter an email subject');
      return;
    }
    if (!message) {
      toast.error('Please enter an email message');
      return;
    }

    setSendingEmail(true);
    try {
      const response = await axios.post(
        `/api/admin/price-match-queries/${query.id}/send-email`,
        { subject, message, to }
      );
      toast.success(
        response.data.message ||
          'Email sent successfully. Check the recipient inbox and spam folder. A copy was also sent to the Sky Tire sender account.'
      );
      setEmailSubject('');
      setEmailMessage('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(error.response?.data?.error || error.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

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
                    label="Cost"
                    value={
                      query.product ? (
                        <span className="font-bold">
                          $ {roundCurrency(query.product.cost).toFixed(2)}
                        </span>
                      ) : (
                        '—'
                      )
                    }
                  />
                  <InfoField
                    label="MAP Price"
                    value={
                      query.product ? (
                        <span className="font-bold">
                          $ {roundCurrency(query.product.mapPrice).toFixed(2)}
                        </span>
                      ) : (
                        '—'
                      )
                    }
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

              <section className="border-t border-gray-100 pt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="h-5 w-5 text-[#1e2a4a]" />
                  <h3 className="text-lg font-bold text-[#1e2a4a]">Send Email Reply</h3>
                </div>

                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div>
                    <label htmlFor="recipient-email" className="block text-sm font-bold text-gray-500 mb-2">
                      Recipient
                    </label>
                    <input
                      id="recipient-email"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-[15px] font-medium text-[#1e2a4a] focus:ring-2 focus:ring-[#1e2a4a]/5 focus:border-[#1e2a4a] transition-all"
                    />
                    {emailTypoSuggestion && (
                      <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
                        <p className="font-semibold">
                          This email address looks like a typo.
                        </p>
                        <p className="mt-1">
                          Did you mean{' '}
                          <button
                            type="button"
                            onClick={() => setRecipientEmail(emailTypoSuggestion)}
                            className="font-bold underline hover:text-amber-700"
                          >
                            {emailTypoSuggestion}
                          </button>
                          ?
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email-subject" className="block text-sm font-bold text-gray-500 mb-2">
                      Email Subject
                    </label>
                    <input
                      id="email-subject"
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Enter email subject"
                      className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-[15px] font-medium text-[#1e2a4a] focus:ring-2 focus:ring-[#1e2a4a]/5 focus:border-[#1e2a4a] transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="email-message" className="block text-sm font-bold text-gray-500 mb-2">
                      Email Message
                    </label>
                    <textarea
                      id="email-message"
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Enter your reply message"
                      rows={6}
                      className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-[15px] font-medium text-[#1e2a4a] focus:ring-2 focus:ring-[#1e2a4a]/5 focus:border-[#1e2a4a] transition-all resize-y min-h-[140px]"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={sendingEmail}
                      className="inline-flex items-center gap-2 bg-[#1e2a4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {sendingEmail ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Email
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
