import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Story, StoryGenre, StoryLength, AudioSettings } from '../types';
import axios from 'axios';
import { 
  ArrowLeftIcon, 
  SparklesIcon, 
  AdjustmentsHorizontalIcon,
  BeakerIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

type Language = 'english' | 'hindi';

const StoryCreator: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({
    analyzing: false,
    generating: false,
    audio: false
  });

  const [formData, setFormData] = useState({
    prompt: '',
    genre: 'fantasy' as StoryGenre,
    length: 'medium' as StoryLength,
    language: 'english' as Language,
    audioSettings: {
      voice: 'female',
      pitch: 1.0,
      speed: 1.0,
      volume: 0.8,
      voiceType: 'female' as const
    } as AudioSettings
  });

  const genres: { 
    value: StoryGenre; 
    label: string; 
    description: string; 
    icon: string; 
    color: string;
    bgGradient: string;
  }[] = [
    { value: 'fantasy', label: 'Fantasy', description: 'Magical worlds & enchanted adventures', icon: '🧙‍♂️', color: 'text-purple-600', bgGradient: 'from-purple-500 to-indigo-600' },
    { value: 'adventure', label: 'Adventure', description: 'Exciting journeys & daring escapades', icon: '🏔️', color: 'text-green-600', bgGradient: 'from-green-500 to-emerald-600' },
    { value: 'mystery', label: 'Mystery', description: 'Intriguing puzzles & suspenseful tales', icon: '🔍', color: 'text-gray-600', bgGradient: 'from-gray-500 to-slate-600' },
    { value: 'romance', label: 'Romance', description: 'Love stories & heartwarming relationships', icon: '💕', color: 'text-pink-600', bgGradient: 'from-pink-500 to-rose-600' },
    { value: 'sci-fi', label: 'Sci-Fi', description: 'Future technology & space exploration', icon: '🚀', color: 'text-blue-600', bgGradient: 'from-blue-500 to-cyan-600' },
    { value: 'horror', label: 'Horror', description: 'Scary stories that keep you on edge', icon: '👻', color: 'text-red-600', bgGradient: 'from-red-500 to-orange-600' },
    { value: 'comedy', label: 'Comedy', description: 'Humorous & light-hearted tales', icon: '😂', color: 'text-yellow-600', bgGradient: 'from-yellow-500 to-amber-600' },
    { value: 'drama', label: 'Drama', description: 'Emotional stories with deep character', icon: '🎭', color: 'text-indigo-600', bgGradient: 'from-indigo-500 to-purple-600' },
    { value: 'thriller', label: 'Thriller', description: 'Suspenseful & action-packed stories', icon: '⚡', color: 'text-orange-600', bgGradient: 'from-orange-500 to-red-600' }
  ];

  const lengths: { 
    value: StoryLength; 
    label: string; 
    wordCount: string;
    icon: string;
    description: string;
  }[] = [
    { value: 'short', label: 'Short Story', wordCount: '600-1,200 words', icon: '📖', description: 'Quick & engaging' },
    { value: 'medium', label: 'Medium Story', wordCount: '1,200-2,500 words', icon: '📚', description: 'Perfect balance' },
    { value: 'long', label: 'Long Story', wordCount: '2,500-4,500 words', icon: '📗', description: 'Deep exploration' },
    { value: 'very long', label: 'Epic Story', wordCount: '4,500-6,000 words', icon: '📙', description: 'Epic adventure' }
  ];

  const languages: {
    value: Language;
    label: string;
    flag: string;
    description: string;
  }[] = [
    { value: 'english', label: 'English', flag: '🇺🇸', description: 'Write story in English' },
    { value: 'hindi', label: 'हिंदी', flag: '🇮🇳', description: 'कहानी हिंदी में लिखें' }
  ];

  const voiceTypes: { 
    value: string; 
    label: string; 
    description: string; 
    icon: string; 
    color: string;
  }[] = [
    { value: 'male', label: 'Male Voice', description: 'Deep & authoritative', icon: '🎤', color: 'text-blue-600' },
    { value: 'female', label: 'Female Voice', description: 'Clear & expressive', icon: '🎵', color: 'text-pink-600' },
    { value: 'child', label: 'Child Voice', description: 'Young & innocent', icon: '🧒', color: 'text-yellow-600' },
    { value: 'elderly', label: 'Elderly Voice', description: 'Wise & experienced', icon: '👴', color: 'text-gray-600' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAudioSettingChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      audioSettings: {
        ...prev.audioSettings,
        [field]: value
      }
    }));
  };

  const surpriseMePrompt = async () => {
    setIsAIGenerating(true);
    try {
      const prompts = [
        "A young wizard discovers their spells work backwards, turning helpful magic into mischievous adventures",
        "An astronaut crashes on a planet where dreams become reality, but nightmares are equally real",
        "A librarian finds that the books in her library can transport readers into their stories",
        "A detective who can only solve crimes in dreams must stay awake long enough to catch a serial killer",
        "Two rival kingdoms are forced to work together when their magical artifacts begin to affect the entire world",
        "A time traveler gets stuck in a loop where they must relive the same day until they get it right",
        "A talking cat discovers it's actually a prince under a spell and needs to solve riddles to break the curse",
        "A village where everyone has superpowers except one person, who discovers they have the rarest power of all",
        "A robot develops emotions and must choose between being human-like or maintaining its artificial perfection",
        "A forest where trees remember every story ever told beneath them begins to tell its own tale"
      ];
      
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      handleInputChange('prompt', randomPrompt);
      toast.success('Random prompt generated!');
      
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast.error('Failed to generate prompt');
    } finally {
      setIsAIGenerating(false);
    }
  };

  const enhancePrompt = async () => {
    if (!formData.prompt.trim()) {
      toast.error('Please enter a prompt first to enhance');
      return;
    }

    setIsAIGenerating(true);
    try {
      // Use AI to enhance the prompt
      const enhancedPrompt = formData.prompt + " This story should have rich character development, vivid descriptions, unexpected plot twists, and meaningful themes that resonate with readers of all ages. Include dialogue that reveals personality and move the story forward dynamically.";
      
      handleInputChange('prompt', enhancedPrompt);
      toast.success('Prompt enhanced!');
      
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast.error('Failed to enhance prompt');
    } finally {
      setIsAIGenerating(false);
    }
  };

  const generateStory = async () => {
    if (!formData.prompt.trim()) {
      toast.error('Please enter a story prompt');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({
      analyzing: true,
      generating: false,
      audio: false
    });
    
    try {
      // Call real AI story generation API
      const response = await axios.post('/api/ai/generate', {
        prompt: formData.prompt,
        genre: formData.genre,
        length: formData.length,
        audioSettings: formData.audioSettings,
        userId: user?.id
      });

      if (response.data.success) {
        const generatedStory = response.data.data;
        
        setGenerationProgress({
          analyzing: false,
          generating: true,
          audio: false
        });

        // Generate audio if audio settings are configured
        if (formData.audioSettings.voiceType) {
          try {
            setGenerationProgress({
              analyzing: false,
              generating: true,
              audio: true
            });

            const audioResponse = await axios.post('/api/audio/narrate', {
              storyId: generatedStory.id,
              storyText: generatedStory.content,
              voice: formData.audioSettings.voiceType,
              speed: formData.audioSettings.speed
            });

            if (audioResponse.data.success) {
              generatedStory.audioUrl = audioResponse.data.data.audioUrl;
              generatedStory.hasAudio = true;
            }
          } catch (audioError) {
            console.warn('Audio generation failed:', audioError);
            // Continue without audio
          }
        }

        // Generate images for the story
        try {
          const imageResponse = await axios.post('/api/images/generate', {
            prompt: `${generatedStory.title} - ${formData.prompt}`,
            style: 'storybook',
            storyId: generatedStory.id,
            userId: user?.id
          });

          if (imageResponse.data.success) {
            generatedStory.imageUrl = imageResponse.data.data.imageUrl;
          }
        } catch (imageError) {
          console.warn('Image generation failed:', imageError);
          // Continue without image
        }

        setGenerationProgress({
          analyzing: false,
          generating: false,
          audio: false
        });

        // Store the generated story
        const existingStories = localStorage.getItem('userStories');
        const stories = existingStories ? JSON.parse(existingStories) : [];
        stories.unshift(generatedStory);
        localStorage.setItem('userStories', JSON.stringify(stories));

        toast.success('Story generated successfully!');
        
        // Navigate to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
        
      } else {
        throw new Error(response.data.error || 'Failed to generate story');
      }
      
    } catch (error) {
      console.error('Story generation failed:', error);
      toast.error('Failed to generate story. Please try again.');
      setGenerationProgress({
        analyzing: false,
        generating: false,
        audio: false
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateStorybook = async () => {
    if (!formData.prompt.trim()) {
      toast.error('Please enter a story prompt');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({
      analyzing: true,
      generating: false,
      audio: false
    });
    
    try {
      // Generate storybook directly from prompt
      const response = await axios.post('/api/storybooks/create-from-prompt', {
        prompt: formData.prompt,
        genre: formData.genre,
        length: formData.length,
        style: 'children-book',
        userId: user?.id,
        sceneCount: 8
      });

      if (response.data.success) {
        const storybook = response.data.data;
        
        // Store the generated storybook
        const existingStorybooks = localStorage.getItem('userStorybooks');
        const storybooks = existingStorybooks ? JSON.parse(existingStorybooks) : [];
        storybooks.unshift(storybook);
        localStorage.setItem('userStorybooks', JSON.stringify(storybooks));

        toast.success('Interactive storybook generated successfully!');
        
        // Navigate to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
        
      } else {
        throw new Error(response.data.error || 'Failed to generate storybook');
      }
      
    } catch (error) {
      console.error('Storybook generation failed:', error);
      toast.error('Failed to generate storybook. Please try again.');
      setGenerationProgress({
        analyzing: false,
        generating: false,
        audio: false
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-xl">📚</span>
            </div>
            <h1 className="ml-3 text-2xl font-bold text-gray-900">Create New Story</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isGenerating ? (
          <div className="text-center py-12">
            <LoadingSpinner size="lg" text="AI is crafting your magical story..." />
            <div className="mt-6 max-w-md mx-auto">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Story Generation Progress</h3>
                <div className="space-y-2">
                  <div className={`flex items-center text-sm ${generationProgress.analyzing ? 'text-blue-600' : 'text-green-600'}`}>
                    <div className={`w-2 h-2 rounded-full mr-3 ${generationProgress.analyzing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                    Analyzing your prompt...
                  </div>
                  <div className={`flex items-center text-sm ${generationProgress.generating ? 'text-blue-600' : 'text-green-600'}`}>
                    <div className={`w-2 h-2 rounded-full mr-3 ${generationProgress.generating ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                    Generating story content with AI...
                  </div>
                  <div className={`flex items-center text-sm ${generationProgress.audio ? 'text-blue-600' : 'text-gray-600'}`}>
                    <div className={`w-2 h-2 rounded-full mr-3 ${generationProgress.audio ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
                    Creating audio narration...
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Story Prompt */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <SparklesIcon className="h-6 w-6 mr-2 text-yellow-500" />
                Story Concept
              </h2>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your story idea
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => handleInputChange('prompt', e.target.value)}
                  placeholder="E.g., A brave young explorer discovers a hidden portal to a magical forest where animals can speak..."
                  className="input-field h-32 resize-none"
                  disabled={isGenerating}
                />
                
                {/* AI Enhancement Buttons */}
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={surpriseMePrompt}
                    disabled={isAIGenerating}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAIGenerating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <BeakerIcon className="h-4 w-4 mr-2" />
                    )}
                    Surprise Me
                  </button>
                  
                  <button
                    onClick={enhancePrompt}
                    disabled={isAIGenerating || !formData.prompt.trim()}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAIGenerating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <RocketLaunchIcon className="h-4 w-4 mr-2" />
                    )}
                    Enhance with AI
                  </button>
                </div>
              </div>
              
              <p className="mt-2 text-sm text-gray-500">
                Be as creative as you'd like! Use "Surprise Me" for random inspiration or "Enhance with AI" to expand your ideas.
              </p>
            </div>

            {/* Genre, Language, and Length Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Genre Selection */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Genre</h3>
                <div className="grid grid-cols-1 gap-3">
                  {genres.map((genre) => (
                    <div
                      key={genre.value}
                      onClick={() => handleInputChange('genre', genre.value)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        formData.genre === genre.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`text-2xl ${formData.genre === genre.value ? genre.color : ''}`}>
                          {genre.icon}
                        </div>
                        <div className="flex-1">
                          <div className={`font-semibold ${
                            formData.genre === genre.value ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {genre.label}
                          </div>
                          <div className="text-sm text-gray-500">{genre.description}</div>
                        </div>
                        {formData.genre === genre.value && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Language</h3>
                <div className="space-y-3">
                  {languages.map((language) => (
                    <div
                      key={language.value}
                      onClick={() => handleInputChange('language', language.value)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        formData.language === language.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{language.flag}</div>
                        <div className="flex-1">
                          <div className={`font-semibold ${
                            formData.language === language.value ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {language.label}
                          </div>
                          <div className="text-sm text-gray-500">{language.description}</div>
                        </div>
                        {formData.language === language.value && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Story Length */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Story Length</h3>
                <div className="space-y-3">
                  {lengths.map((length) => (
                    <div
                      key={length.value}
                      onClick={() => handleInputChange('length', length.value)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        formData.length === length.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`text-2xl ${
                          formData.length === length.value ? 'text-blue-600' : ''
                        }`}>
                          {length.icon}
                        </div>
                        <div className="flex-1">
                          <div className={`font-semibold ${
                            formData.length === length.value ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {length.label}
                          </div>
                          <div className="text-sm text-gray-500">{length.wordCount}</div>
                          <div className="text-xs text-gray-400">{length.description}</div>
                        </div>
                        {formData.length === length.value && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Audio Settings */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                Audio Settings (Optional)
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Voice Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Voice Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {voiceTypes.map((voice) => (
                      <div
                        key={voice.value}
                        onClick={() => handleAudioSettingChange('voiceType', voice.value)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          formData.audioSettings.voiceType === voice.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`text-2xl mb-2 ${
                            formData.audioSettings.voiceType === voice.value ? voice.color : ''
                          }`}>
                            {voice.icon}
                          </div>
                          <div className={`text-sm font-medium ${
                            formData.audioSettings.voiceType === voice.value ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {voice.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{voice.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audio Controls */}
                <div className="space-y-4">
                  {/* Pitch */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pitch: {formData.audioSettings.pitch.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={formData.audioSettings.pitch}
                      onChange={(e) => handleAudioSettingChange('pitch', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Speed */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Speed: {formData.audioSettings.speed.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={formData.audioSettings.speed}
                      onChange={(e) => handleAudioSettingChange('speed', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Volume */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Volume: {Math.round(formData.audioSettings.volume * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.audioSettings.volume}
                      onChange={(e) => handleAudioSettingChange('volume', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Buttons */}
            <div className="text-center space-y-4">
              <button
                onClick={generateStory}
                disabled={!formData.prompt.trim() || isGenerating}
                className="btn-primary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3 inline-block"></div>
                    Creating Your Story...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-6 w-6 mr-2 inline" />
                    Generate Story
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={generateStorybook}
                  disabled={!formData.prompt.trim() || isGenerating}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Generate Interactive Storybook
                </button>
                <p className="mt-2 text-sm text-gray-500">
                  Creates a full illustrated storybook with multiple pages and scenes
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StoryCreator;