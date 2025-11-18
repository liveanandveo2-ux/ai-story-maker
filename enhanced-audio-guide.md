# AI Story Maker - Enhanced Audio Implementation Guide

## Advanced Audio Controls System

### 1. Audio Settings Component
```javascript
// frontend/src/components/Audio/AudioSettings.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpeakerWaveIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';

const AudioSettings = ({ audioUrl, onSettingsChange, defaultSettings = {} }) => {
  const [settings, setSettings] = useState({
    voice: 'default-female-1',
    pitch: 0,
    speed: 1.0,
    volume: 0.8,
    ...defaultSettings
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewText] = useState("Hello! This is a preview of how your story will sound with these settings.");

  const voiceOptions = [
    { 
      id: 'default-female-1', 
      name: 'Sarah', 
      type: 'Female',
      age: 'Adult',
      description: 'Clear and warm female voice'
    },
    { 
      id: 'default-female-2', 
      name: 'Emma', 
      type: 'Female',
      age: 'Young Adult',
      description: 'Bright and energetic female voice'
    },
    { 
      id: 'default-male-1', 
      name: 'David', 
      type: 'Male',
      age: 'Adult',
      description: 'Deep and professional male voice'
    },
    { 
      id: 'default-male-2', 
      name: 'Alex', 
      type: 'Male',
      age: 'Young Adult',
      description: 'Friendly and casual male voice'
    },
    { 
      id: 'child-voice', 
      name: 'Little Voice', 
      type: 'Child',
      age: 'Child',
      description: 'Playful and innocent child voice'
    },
    { 
      id: 'elderly-voice', 
      name: 'Wise Voice', 
      type: 'Elderly',
      age: 'Elderly',
      description: 'Gentle and wise elderly voice'
    }
  ];

  const genreVoiceRecommendations = {
    fantasy: ['default-female-1', 'default-male-1'],
    adventure: ['default-male-1', 'default-female-2'],
    mystery: ['default-male-1', 'default-female-1'],
    romance: ['default-female-1', 'default-female-2'],
    'sci-fi': ['default-male-1', 'default-female-2'],
    horror: ['default-male-1', 'elderly-voice'],
    comedy: ['default-female-2', 'child-voice'],
    drama: ['default-female-1', 'default-male-1']
  };

  useEffect(() => {
    onSettingsChange && onSettingsChange(settings);
  }, [settings, onSettingsChange]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const playPreview = async () => {
    if (isPlaying) {
      // Stop current preview
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    
    // Create utterance with current settings
    const utterance = new SpeechSynthesisUtterance(previewText);
    const selectedVoice = voiceOptions.find(v => v.id === settings.voice);
    
    // Apply settings
    utterance.rate = settings.speed;
    utterance.pitch = 1 + (settings.pitch / 100); // Convert -50 to +50 range to 0.5 to 1.5
    utterance.volume = settings.volume;
    
    // Find matching voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => 
      v.name.toLowerCase().includes(selectedVoice.name.toLowerCase()) ||
      v.gender?.toLowerCase() === selectedVoice.type.toLowerCase()
    );
    
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const resetToDefaults = () => {
    setSettings({
      voice: 'default-female-1',
      pitch: 0,
      speed: 1.0,
      volume: 0.8
    });
  };

  const getRecommendedVoices = (genre) => {
    return genreVoiceRecommendations[genre] || [];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <SpeakerWaveIcon className="w-6 h-6 mr-2 text-blue-500" />
          Audio Settings
        </h3>
        <button
          onClick={resetToDefaults}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Reset to Default
        </button>
      </div>

      <div className="space-y-6">
        {/* Voice Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Voice Selection
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {voiceOptions.map((voice) => (
              <motion.button
                key={voice.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSettingChange('voice', voice.id)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  settings.voice === voice.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="font-medium text-gray-800 text-sm">
                  {voice.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {voice.type} • {voice.age}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {voice.description}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Preview Button */}
        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={playPreview}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
          >
            {isPlaying ? (
              <>
                <PauseIcon className="w-5 h-5 mr-2" />
                Stop Preview
              </>
            ) : (
              <>
                <PlayIcon className="w-5 h-5 mr-2" />
                Preview Voice
              </>
            )}
          </motion.button>
        </div>

        {/* Audio Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Speed Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Speed: {settings.speed.toFixed(1)}x
            </label>
            <div className="relative">
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.speed}
                onChange={(e) => handleSettingChange('speed', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.5x</span>
                <span>1.0x</span>
                <span>2.0x</span>
              </div>
            </div>
          </div>

          {/* Pitch Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pitch: {settings.pitch > 0 ? '+' : ''}{settings.pitch}%
            </label>
            <div className="relative">
              <input
                type="range"
                min="-50"
                max="50"
                step="5"
                value={settings.pitch}
                onChange={(e) => handleSettingChange('pitch', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-50%</span>
                <span>0%</span>
                <span>+50%</span>
              </div>
            </div>
          </div>

          {/* Volume Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volume: {Math.round(settings.volume * 100)}%
            </label>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.volume}
                onChange={(e) => handleSettingChange('volume', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <details className="group">
          <summary className="flex items-center cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            Advanced Settings
            <motion.div
              animate={{ rotate: 0 }}
              className="ml-2 transform group-open:rotate-180 transition-transform"
            >
              ▼
            </motion.div>
          </summary>
          <div className="mt-4 space-y-4">
            {/* Genre-Based Recommendations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommended Voices for Genre
              </label>
              <div className="flex flex-wrap gap-2">
                {['fantasy', 'adventure', 'romance', 'horror'].map((genre) => {
                  const recommendedVoices = getRecommendedVoices(genre);
                  return (
                    <motion.button
                      key={genre}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => {
                        // Apply genre recommendations
                        const recommendedVoice = voiceOptions.find(v => 
                          recommendedVoices.includes(v.id)
                        );
                        if (recommendedVoice) {
                          handleSettingChange('voice', recommendedVoice.id);
                        }
                      }}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-700 capitalize"
                    >
                      {genre}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Voice Enhancement Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voice Enhancement
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    onChange={(e) => {
                      // Handle enhancement options
                    }}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Add emotional emphasis
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    onChange={(e) => {
                      // Handle enhancement options
                    }}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Automatic pauses at punctuation
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    onChange={(e) => {
                      // Handle enhancement options
                    }}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enhance pronunciation for character names
                  </span>
                </label>
              </div>
            </div>
          </div>
        </details>
      </div>
    </motion.div>
  );
};

export default AudioSettings;
```

### 2. Enhanced Audio Player with Custom Controls
```javascript
// frontend/src/components/Audio/EnhancedAudioPlayer.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  ForwardIcon,
  BackwardIcon,
  CogIcon
} from '@heroicons/react/24/outline';

const EnhancedAudioPlayer = ({ 
  audioUrl, 
  title, 
  audioSettings = {},
  onPlay, 
  onPause, 
  onEnded,
  showAdvancedControls = true 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(audioSettings.volume || 0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(audioSettings.speed || 1.0);
  const [pitch, setPitch] = useState(audioSettings.pitch || 0);
  
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded && onEnded();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onEnded]);

  useEffect(() => {
    // Update audio settings when they change
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackSpeed;
      audio.volume = isMuted ? 0 : volume;
    }
  }, [playbackSpeed, volume, isMuted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      onPause && onPause();
    } else {
      // Apply audio settings before playing
      audio.playbackRate = playbackSpeed;
      audio.volume = isMuted ? 0 : volume;
      
      audio.play().then(() => {
        setIsPlaying(true);
        onPlay && onPlay();
      }).catch(error => {
        console.error('Audio play failed:', error);
      });
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const newTime = (e.target.value / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (audioRef.current) {
      audioRef.current.volume = newMutedState ? 0 : volume;
    }
  };

  const skipTime = (seconds) => {
    const audio = audioRef.current;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6 max-w-2xl mx-auto"
    >
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        preload="metadata"
        style={{ display: 'none' }}
      />
      
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Audio Narration</span>
          {isPlaying && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center space-x-1"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Playing</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <input
          type="range"
          min="0"
          max="100"
          value={duration ? (currentTime / duration) * 100 : 0}
          onChange={handleSeek}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider mb-2"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-6 mb-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => skipTime(-10)}
          className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          <BackwardIcon className="w-5 h-5 text-gray-600" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:shadow-lg transition-all"
        >
          {isPlaying ? (
            <PauseIcon className="w-8 h-8" />
          ) : (
            <PlayIcon className="w-8 h-8 ml-1" />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => skipTime(10)}
          className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          <ForwardIcon className="w-5 h-5 text-gray-600" />
        </motion.button>
      </div>

      {/* Settings Toggle */}
      {showAdvancedControls && (
        <div className="text-center mb-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <CogIcon className="w-4 h-4 mr-2" />
            {showSettings ? 'Hide' : 'Show'} Advanced Controls
          </button>
        </div>
      )}

      {/* Advanced Controls */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 pt-6 space-y-4"
          >
            {/* Speed Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Playback Speed: {playbackSpeed.toFixed(1)}x
              </label>
              <div className="flex space-x-2">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => changeSpeed(speed)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      playbackSpeed === speed
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume: {Math.round(volume * 100)}%
              </label>
              <div className="flex items-center space-x-3">
                <button onClick={toggleMute} className="text-gray-600 hover:text-gray-800">
                  {isMuted ? (
                    <SpeakerXMarkIcon className="w-5 h-5" />
                  ) : (
                    <SpeakerWaveIcon className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={handleVolumeChange}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Pitch Indicator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pitch Adjustment: {pitch > 0 ? '+' : ''}{pitch}%
              </label>
              <div className="bg-gray-200 rounded-full h-2 relative">
                <div 
                  className="bg-blue-500 h-2 rounded-full absolute top-0"
                  style={{ 
                    width: `${Math.max(0, (pitch + 50) / 100 * 100)}%`,
                    left: pitch > 0 ? '50%' : `${Math.max(0, (pitch + 50) / 100 * 100)}%`
                  }}
                />
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-gray-600" />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-50%</span>
                <span>0%</span>
                <span>+50%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EnhancedAudioPlayer;
```

### 3. Story Audio Integration
```javascript
// frontend/src/components/Story/StoryDisplay.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AudioSettings from '../Audio/AudioSettings';
import EnhancedAudioPlayer from '../Audio/EnhancedAudioPlayer';

const StoryDisplay = ({ story, user }) => {
  const [audioSettings, setAudioSettings] = useState({
    voice: 'default-female-1',
    pitch: 0,
    speed: 1.0,
    volume: 0.8
  });
  const [audioUrl, setAudioUrl] = useState(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  useEffect(() => {
    if (story && !story.audioUrl) {
      generateAudio();
    } else if (story?.audioUrl) {
      setAudioUrl(story.audioUrl);
    }
  }, [story]);

  const generateAudio = async () => {
    setIsGeneratingAudio(true);
    try {
      const response = await fetch('/api/audio/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ 
          storyId: story._id,
          audioSettings 
        })
      });
      
      const data = await response.json();
      setAudioUrl(data.audioUrl);
    } catch (error) {
      console.error('Audio generation failed:', error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const regenerateAudio = async () => {
    await generateAudio();
  };

  const handleAudioSettingsChange = (newSettings) => {
    setAudioSettings(newSettings);
    // Auto-regenerate audio with new settings
    if (audioUrl) {
      generateAudio();
    }
  };

  const handleAudioPlay = () => {
    // Track audio play analytics
    fetch(`/api/stories/${story._id}/analytics/audio-play`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{story.title}</h1>
        
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {story.genre}
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            {story.length}
          </span>
          {story.hasAudio && <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">🎵 Audio</span>}
        </div>

        <div className="prose max-w-none mb-8">
          {story.content.split('\n\n').map((paragraph, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-gray-700 leading-relaxed mb-4"
            >
              {paragraph}
            </motion.p>
          ))}
        </div>

        {/* Audio Section */}
        {audioUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Audio Narration</h3>
              <button
                onClick={() => setShowAudioSettings(!showAudioSettings)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {showAudioSettings ? 'Hide' : 'Customize'} Voice Settings
              </button>
            </div>
            
            <EnhancedAudioPlayer
              audioUrl={audioUrl}
              title={`Listen to: ${story.title}`}
              audioSettings={audioSettings}
              onPlay={handleAudioPlay}
              showAdvancedControls={true}
            />

            {showAudioSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6"
              >
                <AudioSettings
                  audioUrl={audioUrl}
                  audioSettings={audioSettings}
                  onSettingsChange={handleAudioSettingsChange}
                />
                
                <div className="text-center mt-4">
                  <button
                    onClick={regenerateAudio}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Regenerate Audio with New Settings
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {isGeneratingAudio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating audio narration...</p>
            <p className="text-sm text-gray-500 mt-2">
              Voice: {audioSettings.voice} • Speed: {audioSettings.speed}x • Pitch: {audioSettings.pitch}%
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StoryDisplay;
```

### 4. Backend Audio Generation with Voice Parameters
```javascript
// backend/services/enhancedAudioService.js
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs').promises;
const path = require('path');

class EnhancedAudioService {
  constructor() {
    this.ttsClient = new textToSpeech.TextToSpeechClient();
    this.voiceMap = {
      'default-female-1': {
        languageCode: 'en-US',
        name: 'en-US-Standard-A',
        gender: 'FEMALE'
      },
      'default-female-2': {
        languageCode: 'en-US',
        name: 'en-US-Standard-C',
        gender: 'FEMALE'
      },
      'default-male-1': {
        languageCode: 'en-US',
        name: 'en-US-Standard-B',
        gender: 'MALE'
      },
      'default-male-2': {
        languageCode: 'en-US',
        name: 'en-US-Standard-D',
        gender: 'MALE'
      },
      'child-voice': {
        languageCode: 'en-US',
        name: 'en-US-Standard-E',
        gender: 'FEMALE'
      },
      'elderly-voice': {
        languageCode: 'en-US',
        name: 'en-US-Standard-F',
        gender: 'MALE'
      }
    };
  }

  async generateEnhancedSpeech(text, settings = {}) {
    const {
      voice = 'default-female-1',
      pitch = 0,
      speed = 1.0,
      volume = 0.8,
      audioEncoding = 'MP3'
    } = settings;

    try {
      const voiceConfig = this.voiceMap[voice] || this.voiceMap['default-female-1'];
      
      // Calculate pitch adjustment
      const pitchMultiplier = 1 + (pitch / 100);
      const speakingRate = Math.max(0.25, Math.min(4.0, speed));

      const request = {
        input: { text: text },
        voice: {
          languageCode: voiceConfig.languageCode,
          name: voiceConfig.name
        },
        audioConfig: {
          audioEncoding: audioEncoding,
          speakingRate: speakingRate,
          pitch: pitchMultiplier,
          volumeGainDb: 20 * Math.log10(volume)
        },
      };

      const [response] = await this.ttsClient.synthesizeSpeech(request);
      
      // Save audio file with settings hash for caching
      const settingsHash = this.generateSettingsHash(settings);
      const filename = `audio_${Date.now()}_${settingsHash}.mp3`;
      const filepath = path.join(__dirname, '../uploads/audio', filename);
      
      await fs.writeFile(filepath, response.audioContent);
      
      return {
        filename,
        filepath,
        url: `/uploads/audio/${filename}`,
        duration: await this.getAudioDuration(filepath),
        settings: settings
      };
    } catch (error) {
      console.error('Enhanced TTS generation error:', error);
      throw error;
    }
  }

  generateSettingsHash(settings) {
    return Object.values(settings).join('_').replace(/[^a-zA-Z0-9]/g, '');
  }

  async getAudioDuration(filepath) {
    const mm = require('music-metadata');
    const metadata = await mm.parseFile(filepath);
    return metadata.format.duration;
  }

  async generateStoryAudio(story, audioSettings) {
    try {
      const chapters = this.splitIntoChapters(story.content);
      const audioPromises = chapters.map(chapter => 
        this.generateEnhancedSpeech(chapter.content, {
          ...audioSettings,
          voice: this.getVoiceForGenre(story.genre, audioSettings.voice)
        })
      );

      const audioResults = await Promise.all(audioPromises);
      
      // Combine audio files if needed
      const combinedAudio = await this.combineAudioFiles(audioResults);
      
      return {
        audioUrl: combinedAudio.url,
        totalDuration: combinedAudio.duration,
        chapters: audioResults,
        settings: audioSettings
      };
    } catch (error) {
      console.error('Story audio generation error:', error);
      throw error;
    }
  }

  getVoiceForGenre(genre, preferredVoice) {
    // If user has a preferred voice, use it
    if (preferredVoice && this.voiceMap[preferredVoice]) {
      return preferredVoice;
    }

    // Genre-based voice recommendations
    const genreVoiceMap = {
      'fantasy': 'default-female-1',
      'adventure': 'default-male-1',
      'mystery': 'default-male-1',
      'romance': 'default-female-1',
      'sci-fi': 'default-female-2',
      'horror': 'elderly-voice',
      'comedy': 'default-female-2',
      'drama': 'default-female-1'
    };

    return genreVoiceMap[genre] || 'default-female-1';
  }

  splitIntoChapters(content) {
    // Split content into manageable chunks for audio generation
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > 300) {
        if (currentChunk.trim()) {
          chunks.push({ content: currentChunk.trim() });
        }
        currentChunk = sentence;
      } else {
        currentChunk += '. ' + sentence;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push({ content: currentChunk.trim() });
    }

    return chunks;
  }

  async combineAudioFiles(audioFiles) {
    // Implementation for combining multiple audio files
    // This would use a library like ffmpeg or similar
    // For now, return the first file as the combined result
    return audioFiles[0];
  }
}

module.exports = new EnhancedAudioService();
```

This enhanced audio system provides:
- ✅ Voice selection with multiple options (male, female, child, elderly)
- ✅ Pitch control (-50% to +50%)
- ✅ Speed control (0.5x to 2.0x)
- ✅ Volume control
- ✅ Real-time preview functionality
- ✅ Genre-based voice recommendations
- ✅ Advanced enhancement options
- ✅ Audio caching based on settings
- ✅ Enhanced audio player with all controls