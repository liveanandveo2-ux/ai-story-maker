import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Story } from '../types';
import { ArrowLeftIcon, HeartIcon, EyeIcon, PencilIcon, TrashIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { AudioPlayer } from './AudioPlayer';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

const StoryViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStory(id);
    }
  }, [id]);

  const fetchStory = async (storyId: string) => {
    try {
      // Mock story data - replace with actual API call
      const mockStory: Story = {
        id: storyId,
        title: 'The Enchanted Forest',
        content: `Once upon a time, in a world where magic flowed like rivers through ancient oak trees, there lived a young adventurer named Luna. She had always felt different from the other villagers, sensing whispers in the wind and seeing shadows dance when no one else was looking.

Luna's grandmother, the village's wisdom keeper, had told her stories of the Enchanted Forest - a mystical place where animals could speak, flowers held ancient secrets, and the very air sparkled with magic. "But beware, child," her grandmother would say with twinkling eyes, "for magic comes with great responsibility."

One misty morning, while gathering herbs for her grandmother's remedies, Luna discovered a peculiar path she had never noticed before. The stones along the path seemed to pulse with a gentle, golden light, and the air smelled of jasmine and forgotten dreams.

As she followed the magical trail deeper into the unknown, Luna's heart beat with both excitement and trepidation. She knew that with every step, she was crossing the threshold from the ordinary world into something extraordinary - something that would change her life forever.

The forest welcomed her with a symphony of sounds: birds singing in languages she didn't recognize, leaves rustling with secrets of the past, and somewhere in the distance, the melodious laughter of what could only be magical creatures.

Luna's adventure had begun, and she had no idea that she was about to discover not just the magic of the forest, but the magic that had always lived within her own heart.`,
        genre: 'fantasy',
        length: 'medium',
        prompt: 'A story about a young girl discovering a magical forest with speaking animals',
        creatorId: user?.id || '1',
        creatorName: user?.name || 'Story Creator',
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true,
        wordCount: 284,
        estimatedReadingTime: 1,
        views: 45,
        likes: 12,
        hasAudio: true,
        audioUrl: '/api/audio/story-1.mp3',
        hasStorybook: true,
        storybookId: 'sb-1'
      };

      setStory(mockStory);
      setIsOwner(mockStory.creatorId === user?.id);
    } catch (error) {
      console.error('Failed to fetch story:', error);
      toast.error('Failed to load story');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = () => {
    if (!story) return;
    
    setIsLiked(!isLiked);
    setStory(prev => prev ? {
      ...prev,
      likes: isLiked ? prev.likes - 1 : prev.likes + 1
    } : null);
    
    toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleDelete = async () => {
    if (!story || !isOwner) return;
    
    if (window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      try {
        // API call to delete story
        toast.success('Story deleted successfully');
        navigate('/dashboard');
      } catch (error) {
        toast.error('Failed to delete story');
      }
    }
  };

  const handleEdit = () => {
    if (!story || !isOwner) return;
    // Navigate to edit mode or open edit modal
    toast.success('Edit functionality coming soon!');
  };

  const handleCreateStorybook = () => {
    if (!story) return;
    // Navigate to storybook creator or open modal
    toast.success('Create storybook functionality coming soon!');
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return <LoadingSpinner text="Loading your story..." />;
  }

  if (!story) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Story not found</h3>
          <p className="mt-1 text-sm text-gray-500">The story you're looking for doesn't exist.</p>
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
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Stories
            </button>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                By {story.creatorName}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-500">
                {formatDate(story.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Story Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Story Header */}
          <div className="p-8 pb-0">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{story.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {story.genre}
                  </span>
                  <span>{story.wordCount} words</span>
                  <span>{story.estimatedReadingTime} min read</span>
                </div>
              </div>
              
              {isOwner && (
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={handleEdit}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit story"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete story"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Story Stats */}
            <div className="flex items-center justify-between py-4 border-t border-b border-gray-100">
              <div className="flex items-center space-x-6">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 transition-colors ${
                    isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                  }`}
                >
                  {isLiked ? (
                    <HeartSolidIcon className="h-5 w-5" />
                  ) : (
                    <HeartIcon className="h-5 w-5" />
                  )}
                  <span>{story.likes}</span>
                </button>
                
                <div className="flex items-center space-x-2 text-gray-500">
                  <EyeIcon className="h-5 w-5" />
                  <span>{story.views}</span>
                </div>
              </div>

              {isOwner && !story.hasStorybook && (
                <button
                  onClick={handleCreateStorybook}
                  className="btn-secondary text-sm"
                >
                  Create Storybook
                </button>
              )}
            </div>
          </div>

          {/* Story Text */}
          <div className="p-8">
            <div className="prose prose-lg max-w-none">
              {story.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-6 text-gray-800 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Audio Player */}
          {story.hasAudio && story.audioUrl && (
            <div className="border-t border-gray-100 p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎧 Audio Narration</h3>
              <AudioPlayer
                audioUrl={story.audioUrl}
                title={`${story.title} - Audio Narration`}
                autoPlay={false}
              />
            </div>
          )}

          {/* Image Generation Section */}
          {isOwner && (
            <div className="border-t border-gray-100 p-8 bg-gradient-to-br from-purple-50 to-blue-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 Generate Story Illustration</h3>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-4">
                  Create a custom illustration for your story using AI image generation
                </p>
                <button
                  onClick={() => {
                    // In production, this would open an image generator modal
                    toast.success('Image generation feature available!');
                  }}
                  className="btn-primary flex items-center space-x-2"
                >
                  <span>✨</span>
                  <span>Generate Story Image</span>
                </button>
              </div>
            </div>
          )}

          {/* Story Metadata */}
          <div className="border-t border-gray-100 p-8 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Story Details</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Original Prompt</dt>
                <dd className="mt-1 text-sm text-gray-900">{story.prompt}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Length Category</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{story.length}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(story.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(story.updatedAt)}</dd>
              </div>
            </dl>
            
            {story.hasStorybook && story.storybookId && (
              <div className="mt-6">
                <button
                  onClick={() => navigate(`/storybook/${story.storybookId}`)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <BookOpenIcon className="h-5 w-5" />
                  <span>View as Storybook</span>
                </button>
              </div>
            )}
          </div>
        </article>
      </main>
    </div>
  );
};

export default StoryViewer;