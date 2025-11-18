import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Story } from '../types';
import { PlusIcon, BookOpenIcon, CogIcon, UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { AudioPlayer } from './AudioPlayer';
import LoadingSpinner from './LoadingSpinner';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState<string>('');

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockStories: Story[] = [
        {
          id: '1',
          title: 'The Enchanted Forest',
          content: 'Once upon a time, in a magical forest where the trees whispered ancient secrets and the wind carried melodies of forgotten spells, there lived a young girl named Luna. She had always felt different from the other villagers, sensing whispers in the wind and seeing shadows dance when no one else was looking.',
          genre: 'fantasy',
          length: 'medium',
          prompt: 'A story about a magical forest with talking animals',
          creatorId: user?.id || '',
          creatorName: user?.name || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublic: true,
          wordCount: 1250,
          estimatedReadingTime: 5,
          views: 45,
          likes: 12,
          hasAudio: false,
          audioUrl: undefined,
          hasStorybook: true,
          storybookId: 'sb-1'
        },
        {
          id: '2',
          title: 'Space Adventure',
          content: 'Captain Sarah stared at the alien planet below, her heart racing with excitement and fear. After three years of traveling through the vast emptiness of space, they had finally arrived at their destination. The planet was unlike anything in their databases - a world of purple forests and crystal mountains.',
          genre: 'sci-fi',
          length: 'short',
          prompt: 'A sci-fi adventure set in space',
          creatorId: user?.id || '',
          creatorName: user?.name || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublic: true,
          wordCount: 850,
          estimatedReadingTime: 3,
          views: 23,
          likes: 8,
          hasAudio: false,
          audioUrl: undefined,
          hasStorybook: false
        },
        {
          id: '3',
          title: 'The Mystery Mansion',
          content: 'Detective Marcus walked up the creaky steps of Blackwood Manor, his flashlight cutting through the darkness. The locals had warned him about this place - abandoned for decades, haunted by the ghost of its former owner. But Marcus didn\'t believe in ghosts. He believed in facts, evidence, and truth.',
          genre: 'mystery',
          length: 'medium',
          prompt: 'A detective story set in a haunted mansion',
          creatorId: user?.id || '',
          creatorName: user?.name || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublic: true,
          wordCount: 1100,
          estimatedReadingTime: 4,
          views: 67,
          likes: 23,
          hasAudio: false,
          audioUrl: undefined,
          hasStorybook: false
        }
      ];
      setStories(mockStories);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStory = () => {
    navigate('/create');
  };

  const handleViewStory = (storyId: string) => {
    navigate(`/story/${storyId}`);
  };

  const handleViewStorybook = (storybookId: string) => {
    navigate(`/storybook/${storybookId}`);
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = !filterGenre || story.genre === filterGenre;
    return matchesSearch && matchesGenre;
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your stories..." />;
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-xl">📚</span>
              </div>
              <h1 className="ml-3 text-2xl font-bold text-gray-900">AI Story Maker</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Stories</h2>
          <p className="text-gray-600">Create, read, and share your AI-powered stories</p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className="input-field sm:w-48"
          >
            <option value="">All Genres</option>
            <option value="fantasy">Fantasy</option>
            <option value="adventure">Adventure</option>
            <option value="mystery">Mystery</option>
            <option value="romance">Romance</option>
            <option value="sci-fi">Sci-Fi</option>
            <option value="horror">Horror</option>
            <option value="comedy">Comedy</option>
            <option value="drama">Drama</option>
            <option value="thriller">Thriller</option>
          </select>

          <button
            onClick={handleCreateStory}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create Story</span>
          </button>
        </div>

        {/* Stories Grid */}
        {filteredStories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No stories found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterGenre ? 'Try adjusting your search or filters.' : 'Get started by creating a new story.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <div key={story.id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{story.title}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {story.genre}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{story.content}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{story.wordCount} words</span>
                  <span>{story.estimatedReadingTime} min read</span>
                </div>
                
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-xs text-gray-500">👁 {story.views}</span>
                  <span className="text-xs text-gray-500">❤️ {story.likes}</span>
                  {story.hasAudio && <span className="text-xs text-green-600">🔊 Audio</span>}
                  {story.hasStorybook && <span className="text-xs text-purple-600">📖 Storybook</span>}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewStory(story.id)}
                    className="btn-secondary flex-1 text-sm"
                  >
                    Read Story
                  </button>
                  {story.hasStorybook && (
                    <button
                      onClick={() => handleViewStorybook(story.storybookId!)}
                      className="btn-primary flex-1 text-sm"
                    >
                      View Storybook
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;