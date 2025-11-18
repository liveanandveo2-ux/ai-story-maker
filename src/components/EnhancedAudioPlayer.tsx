import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';

interface EnhancedAudioPlayerProps {
  audioUrl?: string;
  title: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  autoPlay?: boolean;
  showBackgroundMusic?: boolean;
  showSoundEffects?: boolean;
  storyId?: string;
}

export const EnhancedAudioPlayer: React.FC<EnhancedAudioPlayerProps> = ({
  audioUrl,
  title,
  onPlay,
  onPause,
  onEnded,
  autoPlay = false,
  showBackgroundMusic = false,
  showSoundEffects = false,
  storyId
}) => {
  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [hasNarration, setHasNarration] = useState(!!audioUrl);
  
  // Background music state
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(false);
  const [backgroundMusicVolume, setBackgroundMusicVolume] = useState(0.3);
  
  // Audio element refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioUrl && !hasNarration) return;

    setIsLoading(true);
    setError(null);

    const initializeAudio = async () => {
      try {
        if (audioUrl) {
          const response = await fetch(audioUrl);
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            // Demo mode
            console.log('Demo mode audio detected');
            setIsDemoMode(true);
            setDuration(180); // 3 minutes demo
            setIsLoading(false);
            return;
          }
          
          // Regular audio file
          const audio = new Audio();
          audio.preload = 'metadata';
          audio.crossOrigin = 'anonymous';
          audio.volume = volume;
          
          audio.addEventListener('loadedmetadata', () => {
            setDuration(audio.duration);
            setIsLoading(false);
          });
          
          audio.addEventListener('timeupdate', () => {
            setCurrentTime(audio.currentTime);
          });
          
          audio.addEventListener('ended', () => {
            setIsPlaying(false);
            setCurrentTime(0);
            onEnded?.();
          });
          
          audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            setError('Failed to load audio');
            setIsLoading(false);
          });

          audio.src = audioUrl;
          audioRef.current = audio;
        }
      } catch (err) {
        console.log('Error initializing audio, using demo mode:', err);
        setIsDemoMode(true);
        setDuration(180);
        setIsLoading(false);
      }
    };

    initializeAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [audioUrl, onEnded]);

  // Generate narration from text
  const generateNarration = async (text: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/audio/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: storyId,
          storyText: text,
          voice: 'alloy',
          speed: 1.0
        })
      });

      const data = await response.json();
      if (data.success) {
        setHasNarration(true);
        setIsDemoMode(true);
        setDuration(data.data.duration || 180);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to generate narration:', error);
      setError('Failed to generate narration');
      setIsLoading(false);
    }
  };

  // Toggle play/pause
  const togglePlayPause = async () => {
    if (error) return;

    try {
      if (isDemoMode) {
        // Demo mode - simulate playback
        if (isPlaying) {
          setIsPlaying(false);
          onPause?.();
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
        } else {
          setIsPlaying(true);
          onPlay?.();
          
          // Simulate progress
          progressIntervalRef.current = setInterval(() => {
            setCurrentTime(prev => {
              const newTime = prev + 1;
              if (newTime >= duration) {
                setIsPlaying(false);
                onEnded?.();
                if (progressIntervalRef.current) {
                  clearInterval(progressIntervalRef.current);
                }
                return 0;
              }
              return newTime;
            });
          }, 1000);
        }
        return;
      }

      // Real audio playback
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
        onPause?.();
      } else {
        await audioRef.current?.play();
        setIsPlaying(true);
        onPlay?.();
      }
    } catch (err) {
      console.error('Audio play/pause failed:', err);
      setError('Audio playback failed');
    }
  };

  // Toggle background music
  const toggleBackgroundMusic = async () => {
    if (!backgroundMusicEnabled) {
      try {
        const response = await fetch('/api/audio/background-music', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mood: 'calm',
            genre: 'ambient',
            duration: 300
          })
        });

        const data = await response.json();
        if (data.success) {
          setBackgroundMusicEnabled(true);
          // In production, would load and play the background music
          console.log('Background music enabled:', data.data);
        }
      } catch (error) {
        console.error('Failed to load background music:', error);
      }
    } else {
      setBackgroundMusicEnabled(false);
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    setCurrentTime(newTime);
    
    if (audioRef.current && !isDemoMode) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100;
    setVolume(newVolume);
    if (audioRef.current && !isDemoMode) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <span className="text-2xl mr-2">🎧</span>
          {title}
        </h3>
        
        {showBackgroundMusic && (
          <button
            onClick={toggleBackgroundMusic}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              backgroundMusicEnabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🎵 Background Music
          </button>
        )}
      </div>
      
      {isDemoMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-blue-700 text-sm flex items-center">
            <span className="mr-2">ℹ️</span>
            Demo Mode - Story narration simulated
          </p>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="mb-6">
            <input
              type="range"
              min="0"
              max="100"
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isPlaying ? (
                <PauseIcon className="h-6 w-6" />
              ) : (
                <PlayIcon className="h-6 w-6 ml-1" />
              )}
            </button>

            {/* Volume Control */}
            <div className="flex items-center space-x-3 flex-1 ml-6">
              <button
                onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                {volume > 0 ? (
                  <SpeakerWaveIcon className="h-5 w-5" />
                ) : (
                  <SpeakerXMarkIcon className="h-5 w-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={handleVolumeChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-sm text-gray-600 w-12 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

          {/* Additional Features */}
          {showSoundEffects && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                🎭 Sound effects available during playback
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EnhancedAudioPlayer;
