'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CouponForm from '@/components/admin/CouponForm';
import { Coupon } from '@/redux/types/couponTypes';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

export default function EditCouponPage() {
  const { id } = useParams();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        const response = await axios.get(`/api/admin/coupons/${id}`);
        setCoupon(response.data);
      } catch (error) {
        console.error('Error fetching coupon:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCoupon();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-[#1e2a4a] animate-spin" />
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-gray-400">Coupon not found</h2>
      </div>
    );
  }

  return <CouponForm editCoupon={coupon} />;
}
