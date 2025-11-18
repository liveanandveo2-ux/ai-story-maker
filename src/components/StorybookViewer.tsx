import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Storybook, StorybookPage } from '../types';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import { AudioPlayer } from './AudioPlayer';
import LoadingSpinner from './LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

// Image loading with demo mode detection
const ImageWithFallback: React.FC<{
  src: string;
  alt: string;
  className: string;
}> = ({ src, alt, className }) => {
  const [imageState, setImageState] = useState<'loading' | 'success' | 'error' | 'demo'>('loading');
  const [svgContent, setSvgContent] = useState<string | null>(null);
  
  useEffect(() => {
    const checkImage = async () => {
      try {
        const response = await fetch(src);
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          // This is a demo response with SVG
          const data = await response.json();
          if (data.svg) {
            setSvgContent(data.svg);
          }
          setImageState('demo');
          return;
        }
        
        // Regular image file
        setImageState('success');
      } catch (error) {
        console.log('Image load error, using fallback:', error);
        setImageState('error');
      }
    };
    
    checkImage();
  }, [src]);

  if (imageState === 'loading') {
    return (
      <div className={`${className} bg-gray-100 animate-pulse flex items-center justify-center`}>
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (imageState === 'demo') {
    if (svgContent) {
      return (
        <div
          className={className}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      );
    }
    return (
      <div className={`${className} bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center`}>
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Demo Image</h3>
          <p className="text-gray-500 text-sm">{alt}</p>
          <p className="text-xs text-gray-400 mt-2">AI-generated placeholder</p>
        </div>
      </div>
    );
  }

  if (imageState === 'error') {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="text-center p-8">
          <div className="text-4xl mb-4">🖼️</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Image Not Available</h3>
          <p className="text-gray-500 text-sm">{alt}</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setImageState('error')}
    />
  );
};

const StorybookViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [storybook, setStorybook] = useState<Storybook | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchStorybook(id);
    }
  }, [id]);

  const fetchStorybook = async (storybookId: string) => {
    try {
      // Mock storybook data - replace with actual API call
      const mockStorybook: Storybook = {
        id: storybookId,
        storyId: '1',
        title: 'The Enchanted Forest - Interactive Storybook',
        creatorId: user?.id || '1',
        createdAt: new Date(),
        totalDuration: 420, // 7 minutes
        pages: [
          {
            id: 'page-1',
            pageNumber: 1,
            content: 'Once upon a time, in a world where magic flowed like rivers through ancient oak trees, there lived a young adventurer named Luna.',
            imageUrl: '/api/images/forest-entrance.jpg',
            animationElements: [
              {
                id: 'sparkle-1',
                type: 'magical-element',
                x: 20,
                y: 30,
                width: 40,
                height: 40,
                animation: {
                  element: 'sparkle-1',
                  type: 'fadeIn' as const,
                  duration: 2000,
                  delay: 0,
                  properties: {
                    from: { opacity: 0, scale: 0 },
                    to: { opacity: 1, scale: 1 }
                  }
                }
              }
            ]
          },
          {
            id: 'page-2',
            pageNumber: 2,
            content: 'She had always felt different from the other villagers, sensing whispers in the wind and seeing shadows dance when no one else was looking.',
            imageUrl: '/api/images/placeholder.jpg'
          },
          {
            id: 'page-3',
            pageNumber: 3,
            content: 'One misty morning, while gathering herbs, Luna discovered a peculiar path she had never noticed before.',
            imageUrl: '/api/images/placeholder.jpg'
          },
          {
            id: 'page-4',
            pageNumber: 4,
            content: 'The stones along the path seemed to pulse with a gentle, golden light, and the air smelled of jasmine and forgotten dreams.',
            imageUrl: '/api/images/placeholder.jpg'
          },
          {
            id: 'page-5',
            pageNumber: 5,
            content: 'As she followed the magical trail deeper into the unknown, Luna\'s heart beat with both excitement and trepidation.',
            imageUrl: '/api/images/placeholder.jpg'
          }
        ]
      };

      setStorybook(mockStorybook);
    } catch (error) {
      console.error('Failed to fetch storybook:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const currentPage = storybook?.pages[currentPageIndex];
  const totalPages = storybook?.pages.length || 0;

  const nextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  const goToPage = (pageIndex: number) => {
    setCurrentPageIndex(pageIndex);
  };

  const toggleAutoPlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Auto-advance pages when autoplay is enabled
  useEffect(() => {
    if (isPlaying && totalPages > 0) {
      const interval = setInterval(() => {
        setCurrentPageIndex(prev => {
          if (prev >= totalPages - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 8000); // 8 seconds per page

      return () => clearInterval(interval);
    }
  }, [isPlaying, totalPages]);

  if (loading) {
    return <LoadingSpinner text="Loading your interactive storybook..." />;
  }

  if (!storybook || !currentPage) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Storybook not found</h3>
          <p className="text-gray-500">The storybook you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-xl">📚</span>
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">{storybook.title}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Page {currentPageIndex + 1} of {totalPages}
              </span>
              <button
                onClick={toggleAutoPlay}
                className={`p-2 rounded-full transition-colors ${
                  isPlaying 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                }`}
                title={isPlaying ? 'Pause autoplay' : 'Start autoplay'}
              >
                {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Storybook View */}
      <main className="flex-1 flex">
        {/* Page Navigation Sidebar */}
        <div className="w-64 bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pages</h3>
            <div className="space-y-2">
              {storybook.pages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => goToPage(index)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    index === currentPageIndex
                      ? 'bg-blue-100 text-blue-900 border-l-4 border-blue-500'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500 w-8">
                      {page.pageNumber}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {page.content.substring(0, 80)}...
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Storybook Content */}
        <div className="flex-1 flex flex-col">
          {/* Page Content */}
          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPageIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 flex"
              >
                {/* Image Section */}
                <div className="w-1/2 relative overflow-hidden">
                  {currentPage.imageUrl && (
                    <ImageWithFallback
                      src={currentPage.imageUrl}
                      alt={`Page ${currentPage.pageNumber}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Text Section */}
                <div className="w-1/2 p-8 flex flex-col justify-center bg-white">
                  <div className="max-w-md mx-auto">
                    <div className="mb-6">
                      <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        Page {currentPage.pageNumber}
                      </span>
                    </div>
                    
                    <p className="text-lg leading-relaxed text-gray-800 mb-6">
                      {currentPage.content}
                    </p>

                    {/* Interactive Elements */}
                    {currentPage.animationElements && (
                      <div className="relative h-32 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 overflow-hidden">
                        {currentPage.animationElements.map((element) => (
                          <motion.div
                            key={element.id}
                            className="absolute bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-80"
                            style={{
                              left: `${element.x}%`,
                              top: `${element.y}%`,
                              width: `${element.width}%`,
                              height: `${element.height}%`
                            }}
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.8, 1, 0.8]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            ✨
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <button
                onClick={prevPage}
                disabled={currentPageIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
                <span>Previous</span>
              </button>

              {/* Progress Bar */}
              <div className="flex-1 mx-8">
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentPageIndex + 1) / totalPages) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    {storybook.pages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToPage(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentPageIndex ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={nextPage}
                disabled={currentPageIndex === totalPages - 1}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StorybookViewer;