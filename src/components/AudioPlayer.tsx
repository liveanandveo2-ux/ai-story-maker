import React from 'react';

// Universal Audio Player Component
// Cross-browser compatible audio player with fallback support

interface AudioPlayerProps {
  audioUrl: string;
  title: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  title,
  onPlay,
  onPause,
  onEnded,
  autoPlay = false
}) => {
  // State management
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(0.8);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = React.useState(false);

  // Audio element ref
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Demo audio data - simple beep sound (for demo purposes)
  const generateDemoAudio = () => {
    // Create a simple demo audio using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    // For demo: simulate a 3-second "story narration"
    return {
      play: () => {
        setIsPlaying(true);
        setDuration(180); // 3 minutes demo
        onPlay?.();
      },
      pause: () => {
        setIsPlaying(false);
        onPause?.();
      },
      currentTime: 0,
      duration: 180,
      volume: volume
    };
  };

  // Initialize audio element
  React.useEffect(() => {
    if (!audioUrl) return;

    setIsLoading(true);
    setError(null);

    // Check if this is a demo response
    const checkAudioUrl = async () => {
      try {
        const response = await fetch(audioUrl);
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          // This is a demo response, use demo audio
          console.log('Demo mode audio detected, using simulated audio');
          setIsDemoMode(true);
          setIsLoading(false);
          return;
        }
        
        // Regular audio file
        const audio = new Audio();
        audio.preload = 'metadata';
        audio.crossOrigin = 'anonymous';
        
        // Event listeners
        audio.addEventListener('loadstart', () => setIsLoading(true));
        audio.addEventListener('canplay', () => {
          setIsLoading(false);
          setDuration(audio.duration);
        });
        audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          onEnded?.();
        });
        audio.addEventListener('error', handleAudioError);
        audio.addEventListener('loadedmetadata', () => {
          setDuration(audio.duration);
        });

        audio.src = audioUrl;
        audioRef.current = audio;
        setIsLoading(false);
        
      } catch (err) {
        console.log('Error checking audio, using demo mode:', err);
        setIsDemoMode(true);
        setIsLoading(false);
      }
    };

    checkAudioUrl();

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [audioUrl, onEnded]);

  const handleAudioError = (e: Event) => {
    const target = e.target as HTMLAudioElement;
    const error = target.error;
    let errorMessage = 'Audio playback failed';

    switch (error?.code) {
      case error?.MEDIA_ERR_ABORTED:
        errorMessage = 'Audio playback was aborted';
        break;
      case error?.MEDIA_ERR_NETWORK:
        errorMessage = 'Network error occurred';
        break;
      case error?.MEDIA_ERR_DECODE:
        errorMessage = 'Audio format not supported';
        break;
      case error?.MEDIA_ERR_SRC_NOT_SUPPORTED:
        errorMessage = 'Audio source not supported';
        break;
    }

    setError(errorMessage);
    setIsLoading(false);
  };

  const togglePlayPause = async () => {
    if (error) return;

    try {
      if (isDemoMode) {
        // Demo mode - simulate audio playback
        if (isPlaying) {
          setIsPlaying(false);
          onPause?.();
        } else {
          setIsPlaying(true);
          onPlay?.();
          // Simulate progress
          const interval = setInterval(() => {
            setCurrentTime(prev => {
              const newTime = prev + 1;
              if (newTime >= duration) {
                setIsPlaying(false);
                onEnded?.();
                clearInterval(interval);
                return 0;
              }
              return newTime;
            });
          }, 1000);
        }
        return;
      }

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
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      {isDemoMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-blue-700 text-sm">🎵 Demo Audio Mode - Story narration will be simulated</p>
        </div>
      )}
      
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {!isLoading && (
        <>
          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max="100"
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volume: {Math.round(volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Play/Pause Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={togglePlayPause}
              className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              {isPlaying ? (
                <span>⏸</span>
              ) : (
                <span>▶</span>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};