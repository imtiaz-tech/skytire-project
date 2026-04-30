'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAppDispatch } from '@/redux/hooks';
import { fetchBlogById } from '@/redux/slices/blogsSlice';
import BlogForm from '@/components/admin/BlogForm';
import { Loader2 } from 'lucide-react';
import { Blog } from '@/redux/types/blogTypes';

export default function EditBlogPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      dispatch(fetchBlogById(id as string))
        .unwrap()
        .then((data) => {
          setBlog(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id, dispatch]);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#3B5998]" /></div>;
  }

  if (!blog) {
    return <div className="p-8 text-red-500 font-bold">Blog not found.</div>;
  }

  return <BlogForm editBlog={blog} />;
}
