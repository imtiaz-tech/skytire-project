'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { createBlog, updateBlog } from '@/redux/slices/blogsSlice';
import { fetchBlogCategories, createBlogCategory } from '@/redux/slices/blogCategoriesSlice';
import { Blog, BlogStatus } from '@/redux/types/blogTypes';
import { ArrowLeft, Upload, X, Loader2, RefreshCw, Plus, Trash2, ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';
import ManageCategoriesModal from './ManageCategoriesModal';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

interface BlogFormProps {
  editBlog?: Blog;
}

export default function BlogForm({ editBlog }: BlogFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector((state) => state.blogCategories);
  const { user } = useAppSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [keywordArray, setKeywordArray] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  const [formData, setFormData] = useState({
    authorName: 'Admin',
    blogTitle: '',
    readingTime: '',
    slug: '',
    blogBody: '',
    keywords: '',
    blogStatus: BlogStatus.DRAFT,
    categoryId: '',
    isFeatured: false,
    ctaHeading: '',
    ctaDescription: '',
    ctaButtonUrl: '',
    ctaButtonText: '',
  });

  const [colors, setColors] = useState({
    heading: '#0de7e4',
    description: '#1096ea',
    buttonText: '#184B99',
    buttonBg: '#4f939c',
    sectionBg: '#669bea',
  });

  const [sections, setSections] = useState<{ title: string; content: string }[]>([]);
  const [isSlugManual, setIsSlugManual] = useState(false);

  useEffect(() => {
    dispatch(fetchBlogCategories());
  }, [dispatch]);

  useEffect(() => {
    if (user?.name && !editBlog) {
      setFormData(prev => ({ ...prev, authorName: user.name }));
    }
  }, [user, editBlog]);

  useEffect(() => {
    if (editBlog) {
      setFormData({
        authorName: editBlog.authorName || editBlog.author?.name || 'Admin',
        blogTitle: editBlog.blogTitle,
        readingTime: editBlog.readingTime?.toString() || '',
        slug: editBlog.slug,
        blogBody: editBlog.blogBody,
        keywords: editBlog.keywords ? editBlog.keywords.join(', ') : '',
        blogStatus: editBlog.blogStatus,
        categoryId: editBlog.categoryId,
        isFeatured: editBlog.isFeatured,
        ctaHeading: editBlog.ctaHeading || '',
        ctaDescription: editBlog.ctaDescription || '',
        ctaButtonUrl: editBlog.ctaButtonUrl || '',
        ctaButtonText: editBlog.ctaButtonText || '',
      });
      
      if (editBlog.colors) {
        setColors(editBlog.colors);
      }
      
      if (editBlog.keywords && Array.isArray(editBlog.keywords)) {
        setKeywordArray(editBlog.keywords);
      }
      
      if (editBlog.sections && Array.isArray(editBlog.sections)) {
        setSections(editBlog.sections);
      }
      
      setIsSlugManual(true);
      
      if (editBlog.featuredImage) {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
        const cleanPath = editBlog.featuredImage.startsWith('uploads/') ? editBlog.featuredImage.replace('uploads/', '') : editBlog.featuredImage;
        setImagePreview(`${baseUrl}/uploads/${cleanPath}`);
      }
    }
  }, [editBlog]);

  useEffect(() => {
    if (!isSlugManual && formData.blogTitle && !editBlog) {
      const generatedSlug = formData.blogTitle
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
      setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.blogTitle, isSlugManual, editBlog]);

  const regenerateSlug = () => {
    const generatedSlug = formData.blogTitle
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
    setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    setIsSlugManual(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const addSection = () => {
    setSections([...sections, { title: '', content: '' }]);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, field: 'title' | 'content', value: string) => {
    const newSections = [...sections];
    newSections[index][field] = value;
    setSections(newSections);
  };

  const handleSaveNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const slug = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const resultAction = await dispatch(createBlogCategory({ name: newCategoryName, slug }));
      if (createBlogCategory.fulfilled.match(resultAction)) {
        setFormData({ ...formData, categoryId: resultAction.payload.id });
        setNewCategoryName('');
        setIsAddingNewCategory(false);
        setIsCategoryDropdownOpen(false);
      } else {
        console.error('Failed to create category:', resultAction.payload || resultAction.error);
        alert(`Failed to create category: ${resultAction.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category');
    }
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveNewCategory();
    }
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ';') {
      e.preventDefault();
      const val = keywordInput.trim().replace(/;$/, '');
      if (val && !keywordArray.includes(val)) {
        setKeywordArray([...keywordArray, val]);
      }
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywordArray(keywordArray.filter((k) => k !== kw));
  };

  const handleSubmit = async (e: React.FormEvent, statusOverride?: BlogStatus) => {
    e.preventDefault();
    setLoading(true);

    const submitStatus = statusOverride || formData.blogStatus;

    // Validate Category
    if (!formData.categoryId) {
      alert('Please select a category');
      setLoading(false);
      return;
    }

    const categoryExists = categories.some(c => c.id === formData.categoryId);
    if (!categoryExists) {
      alert('The selected category is invalid or no longer exists. Please select a different category.');
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append('blogTitle', formData.blogTitle);
    data.append('slug', formData.slug);
    data.append('blogBody', formData.blogBody);
    data.append('authorName', formData.authorName);
    data.append('keywords', JSON.stringify(keywordArray));
    data.append('blogStatus', submitStatus);
    data.append('categoryId', formData.categoryId);
    data.append('isFeatured', String(formData.isFeatured));
    data.append('ctaHeading', formData.ctaHeading);
    data.append('ctaDescription', formData.ctaDescription);
    data.append('ctaButtonUrl', formData.ctaButtonUrl);
    data.append('ctaButtonText', formData.ctaButtonText);
    data.append('colors', JSON.stringify(colors));
    data.append('sections', JSON.stringify(sections));
    
    // Pass reading time explicitly if set by user
    if (formData.readingTime) {
      data.append('readingTime', formData.readingTime);
    }

    if (selectedImage) {
      data.append('featuredImage', selectedImage);
    }

    try {
      if (editBlog) {
        await dispatch(updateBlog({ id: editBlog.id, formData: data })).unwrap();
      } else {
        await dispatch(createBlog(data)).unwrap();
      }
      router.push('/admin/blogs');
      router.refresh();
    } catch (err) {
      console.error('Failed to save blog:', err);
      alert('Failed to save blog');
    } finally {
      setLoading(false);
    }
  };

  const config = useMemo(() => ({
    readonly: false,
    height: 400,
    uploader: { insertImageAsBase64URI: true },
  }), []);

  return (
    <div className="space-y-8 py-8 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2.5 bg-white border border-gray-100 rounded-xl text-[#1e2a4a] hover:bg-gray-50 transition-all shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-[#1e2a4a]">
            {editBlog ? 'Edit Blog' : 'Add New Blog'}
          </h1>
        </div>
      </div>

      <form className="space-y-8">
        {/* Featured Image */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative group w-[200px] h-[200px]">
            <div className={`w-full h-full border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all overflow-hidden ${imagePreview ? 'border-transparent' : 'border-gray-300 bg-transparent group-hover:bg-gray-50 group-hover:border-blue-200'}`}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-[#8292AD] group-hover:text-[#3B5998]">
                  <Upload className="h-7 w-7 mb-2 opacity-50 group-hover:opacity-100" />
                  <span className="text-[13px] font-medium">Add Image</span>
                </div>
              )}
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} required={!editBlog} />
            </div>
            {imagePreview && (
              <button type="button" onClick={handleRemoveImage} className="absolute -top-3 -right-3 p-1.5 bg-gray-500 text-white rounded-full hover:bg-red-500 shadow-lg border-2 border-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Top Row: Author Name and Featured */}
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[13px] font-medium text-[#8292AD] z-10">Author Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" 
                value={formData.authorName} 
                onChange={(e) => setFormData({ ...formData, authorName: e.target.value })} 
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input type="checkbox" className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-300 bg-white transition-all checked:bg-[#3B5998] checked:border-[#3B5998]" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} />
                <svg className="absolute left-0.5 top-0.5 h-4 w-4 fill-white opacity-0 transition-opacity peer-checked:opacity-100" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              </div>
              <span className="text-[15px] font-medium text-[#1e2a4a]">Featured</span>
            </label>
          </div>

          {/* Second Row: Blog Title & Reading Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative w-full">
              {formData.blogTitle && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Blog Title</label>}
              <input 
                type="text" 
                placeholder="Blog Title"
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" 
                value={formData.blogTitle} 
                onChange={(e) => setFormData({ ...formData, blogTitle: e.target.value })} 
                required 
              />
            </div>
            <div className="relative w-full">
              {formData.readingTime && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Reading Time (minutes)</label>}
              <input 
                type="text" 
                placeholder="Reading Time (minutes)"
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" 
                value={formData.readingTime} 
                onChange={(e) => setFormData({ ...formData, readingTime: e.target.value.replace(/[^0-9]/g, '') })} 
              />
            </div>
          </div>

          {/* Third Row: URL Slug */}
          <div className="relative">
            {formData.slug && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">URL Slug</label>}
            <input 
              type="text" 
              placeholder="URL Slug"
              className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none pr-12" 
              value={formData.slug} 
              onChange={(e) => { setIsSlugManual(true); setFormData({ ...formData, slug: e.target.value }); }} 
              required 
            />
            <button type="button" onClick={regenerateSlug} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1e2a4a]" title="Regenerate slug">
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>

          {/* Fourth Row: Category Custom Dropdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="flex gap-3 w-full">
              <div className="relative flex-1">
              {!isAddingNewCategory ? (
                <>
                  <div className="relative w-full z-20">
                    <label className={`absolute -top-2.5 left-3 px-1 text-[12px] font-medium z-10 transition-colors ${isCategoryDropdownOpen ? 'bg-white text-blue-500' : 'bg-white text-gray-400'}`}>Category</label>
                    <div 
                      className={`w-full px-4 py-3.5 bg-white border rounded-xl text-[#1e2a4a] flex justify-between items-center cursor-pointer transition-colors ${isCategoryDropdownOpen ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-gray-200 hover:border-gray-300'}`}
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    >
                      <span>
                        {categories.find(c => c.id === formData.categoryId)?.name || ''}
                      </span>
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    </div>
                  </div>
                  
                  {isCategoryDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsCategoryDropdownOpen(false)}></div>
                      <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] z-30 py-2">
                        <ul className="max-h-60 overflow-y-auto">
                          {categories.map((c) => (
                            <li 
                              key={c.id} 
                              className="px-5 py-3 hover:bg-gray-100 cursor-pointer text-[#1e2a4a] text-[15px]"
                              onClick={() => {
                                setFormData({ ...formData, categoryId: c.id });
                                setIsCategoryDropdownOpen(false);
                              }}
                            >
                              {c.name}
                            </li>
                          ))}
                          <li 
                            className="px-5 py-3 hover:bg-gray-100 cursor-pointer text-[#1e2a4a] text-[15px]"
                            onClick={() => {
                              setIsAddingNewCategory(true);
                              setIsCategoryDropdownOpen(false);
                            }}
                          >
                            + Add New Category
                          </li>
                        </ul>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="relative w-full">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-500 z-10">Category</label>
                    <div 
                      className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] flex justify-between items-center cursor-pointer hover:border-gray-300 transition-colors"
                      onClick={() => setIsAddingNewCategory(false)}
                    >
                      <span className="text-[15px]">+ Add New Category</span>
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    </div>
                  </div>
                  <div>
                    <input 
                      type="text" 
                      autoFocus
                      placeholder="Enter new category name"
                      className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-[15px]"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={handleCategoryKeyDown}
                    />
                    <p className="text-[13px] text-gray-500 mt-2 px-1">Press Enter to save</p>
                  </div>
                </div>
              )}
              </div>
              
              <button 
                type="button" 
                onClick={() => setIsManageCategoriesOpen(true)}
                className="px-6 py-3.5 bg-white border border-blue-200 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap h-[54px]"
              >
                Manage
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4 pt-4">
          <label className="text-[18px] font-bold text-[#1e2a4a]">Main Content (Introduction)</label>
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
             <JoditEditor value={formData.blogBody} config={config} onBlur={(newContent) => setFormData({ ...formData, blogBody: newContent })} />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <label className="text-[18px] font-bold text-[#1e2a4a]">Article Sections</label>
            <button type="button" onClick={addSection} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-blue-200 text-blue-600 font-bold rounded-xl hover:bg-blue-50">
              Add Section
            </button>
          </div>
          {sections.map((section, index) => (
            <div key={index} className="p-6 border border-gray-200 rounded-2xl bg-[#fafbfc] space-y-4 relative group">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-[#1e2a4a]">Section {index + 1}</h4>
                <button type="button" onClick={() => removeSection(index)} className="text-[#ff6b6b] text-[14px] font-bold hover:text-red-600">
                  Remove
                </button>
              </div>
              <input type="text" placeholder="Section Title" className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" value={section.title} onChange={(e) => updateSection(index, 'title', e.target.value)} />
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <JoditEditor value={section.content} config={config} onBlur={(newContent) => updateSection(index, 'content', newContent)} />
              </div>
            </div>
          ))}
        </div>

        {/* Keywords */}
        <div className="pt-4 space-y-3">
          <input 
            type="text"
            placeholder="Type keywords and press Enter or semi-colon (;)"
            className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" 
            value={keywordInput} 
            onChange={(e) => setKeywordInput(e.target.value)} 
            onKeyDown={handleKeywordKeyDown}
          />
          {keywordArray.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {keywordArray.map((kw, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eef0f4] text-[#1e2a4a] text-[14px] rounded-full">
                  <span>{kw}</span>
                  <button type="button" onClick={() => removeKeyword(kw)} className="text-gray-400 hover:text-gray-600 focus:outline-none flex-shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Fields */}
        <div className="space-y-6 pt-4">
          <label className="block mb-6 text-[18px] font-bold text-[#1e2a4a]">
            Button Section Settings
          </label>          
          <div className="space-y-6">
            {/* CTA Heading */}
            <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
              <div className="relative w-full">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">CTA Heading</label>
                <input type="text" className="w-full px-4 py-3 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" value={formData.ctaHeading} onChange={(e) => setFormData({ ...formData, ctaHeading: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <div className="w-[50px] h-[50px] rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                  <input type="color" className="w-full h-full p-0 border-0 cursor-pointer scale-150" value={colors.heading} onChange={(e) => setColors({ ...colors, heading: e.target.value })} />
                </div>
                <div className="relative w-[150px]">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Heading Color</label>
                  <input type="text" className="w-full px-4 py-3 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" value={colors.heading} onChange={(e) => setColors({ ...colors, heading: e.target.value })} />
                </div>
              </div>
            </div>

            {/* CTA Description */}
            <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
              <div className="relative w-full">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">CTA Description</label>
                <input type="text" className="w-full px-4 py-3 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" value={formData.ctaDescription} onChange={(e) => setFormData({ ...formData, ctaDescription: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <div className="w-[50px] h-[50px] rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                  <input type="color" className="w-full h-full p-0 border-0 cursor-pointer scale-150" value={colors.description} onChange={(e) => setColors({ ...colors, description: e.target.value })} />
                </div>
                <div className="relative w-[150px]">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Description Color</label>
                  <input type="text" className="w-full px-4 py-3 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" value={colors.description} onChange={(e) => setColors({ ...colors, description: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Button URL & Button Text */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative w-full">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Button URL</label>
                <input type="text" className="w-full px-4 py-3 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" value={formData.ctaButtonUrl} onChange={(e) => setFormData({ ...formData, ctaButtonUrl: e.target.value })} />
              </div>
              <div className="relative w-full">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Button Text</label>
                <input type="text" className="w-full px-4 py-3 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" value={formData.ctaButtonText} onChange={(e) => setFormData({ ...formData, ctaButtonText: e.target.value })} />
              </div>
            </div>

            {/* Button Bg Color & Button Text Color */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-2">
                <div className="w-[50px] h-[50px] rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                  <input type="color" className="w-full h-full p-0 border-0 cursor-pointer scale-150" value={colors.buttonBg} onChange={(e) => setColors({ ...colors, buttonBg: e.target.value })} />
                </div>
                <div className="relative flex-1">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Button Bg Color</label>
                  <input type="text" className="w-full px-4 py-3 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" value={colors.buttonBg} onChange={(e) => setColors({ ...colors, buttonBg: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-[50px] h-[50px] rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                  <input type="color" className="w-full h-full p-0 border-0 cursor-pointer scale-150" value={colors.buttonText} onChange={(e) => setColors({ ...colors, buttonText: e.target.value })} />
                </div>
                <div className="relative flex-1">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Button Text Color</label>
                  <input type="text" className="w-full px-4 py-3 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" value={colors.buttonText} onChange={(e) => setColors({ ...colors, buttonText: e.target.value })} />
                </div>
              </div>
            </div>

            {/* CTA Section Background Color */}
            <div className="flex gap-2 w-full md:w-[calc(50%-12px)]">
              <div className="w-[50px] h-[50px] rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                <input type="color" className="w-full h-full p-0 border-0 cursor-pointer scale-150" value={colors.sectionBg} onChange={(e) => setColors({ ...colors, sectionBg: e.target.value })} />
              </div>
              <div className="relative flex-1">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">CTA Section Background Color</label>
                <input type="text" className="w-full px-4 py-3 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" value={colors.sectionBg} onChange={(e) => setColors({ ...colors, sectionBg: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
          <button type="button" onClick={(e) => handleSubmit(e, BlogStatus.DRAFT)} disabled={loading} className="px-8 py-3 bg-white border border-blue-500 text-blue-500 rounded-lg font-bold hover:bg-blue-50 transition-colors flex items-center gap-2">
            {loading && formData.blogStatus === BlogStatus.DRAFT && <Loader2 className="h-4 w-4 animate-spin" />}
            Save as Draft
          </button>
          <button type="button" onClick={(e) => handleSubmit(e, BlogStatus.PUBLISHED)} disabled={loading} className="px-8 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors shadow-md flex items-center gap-2">
            {loading && formData.blogStatus === BlogStatus.PUBLISHED && <Loader2 className="h-4 w-4 animate-spin" />}
            Publish Blog
          </button>
        </div>
      </form>

      {/* Manage Categories Modal */}
      {isManageCategoriesOpen && (
        <ManageCategoriesModal onClose={() => setIsManageCategoriesOpen(false)} />
      )}
    </div>
  );
}
