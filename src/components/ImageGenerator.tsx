import React, { useState, useEffect } from 'react';
import { PhotoIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ImageGeneratorProps {
  prompt: string;
  style?: string;
  size?: string;
  onImageGenerated?: (imageUrl: string) => void;
  storyId?: string;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  prompt,
  style = 'storybook',
  size = '1024x1024',
  onImageGenerated,
  storyId
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [svgPlaceholder, setSvgPlaceholder] = useState<string | null>(null);

  const generateImage = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style,
          size,
          storyId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedImage(data.data.imageUrl);
        setSvgPlaceholder(data.data.svg);
        onImageGenerated?.(data.data.imageUrl);
      } else {
        setError(data.error || 'Failed to generate image');
      }
    } catch (err) {
      console.error('Image generation error:', err);
      setError('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <PhotoIcon className="h-6 w-6 mr-2 text-purple-600" />
          AI Image Generator
        </h3>
        <button
          onClick={generateImage}
          disabled={isGenerating || !prompt}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              <span>Generate Image</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {generatedImage && svgPlaceholder && (
        <div className="mt-4">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <div 
              className="w-full rounded-lg overflow-hidden"
              dangerouslySetInnerHTML={{ __html: svgPlaceholder }}
            />
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Style:</span> {style} | 
                <span className="font-medium ml-2">Size:</span> {size}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Demo mode - In production, this would be a real AI-generated image
              </p>
            </div>
          </div>
        </div>
      )}

      {!generatedImage && !isGenerating && (
        <div className="mt-4 bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
          <PhotoIcon className="h-16 w-16 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-2">No image generated yet</p>
          <p className="text-sm text-gray-500">
            Click "Generate Image" to create an AI illustration
          </p>
        </div>
      )}
    </div>
  );
};

interface StorybookImageGeneratorProps {
  scenes: string[];
  style?: string;
  characterDescriptions?: Record<string, string>;
  onImagesGenerated?: (images: any[]) => void;
  storyId?: string;
}

export const StorybookImageGenerator: React.FC<StorybookImageGeneratorProps> = ({
  scenes,
  style = 'children-book',
  characterDescriptions = {},
  onImagesGenerated,
  storyId
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const generateStorybookImages = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setProgress(0);

      const response = await fetch('/api/images/generate-storybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          scenes,
          style,
          characterDescriptions
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedImages(data.data.images);
        setProgress(100);
        onImagesGenerated?.(data.data.images);
      } else {
        setError(data.error || 'Failed to generate storybook images');
      }
    } catch (err) {
      console.error('Storybook image generation error:', err);
      setError('Failed to generate storybook images');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <PhotoIcon className="h-6 w-6 mr-2 text-purple-600" />
          Storybook Image Generator
        </h3>
        <button
          onClick={generateStorybookImages}
          disabled={isGenerating || scenes.length === 0}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              <span>Generating {scenes.length} images...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              <span>Generate All Images</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {isGenerating && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Generating images for {scenes.length} scenes...
          </p>
        </div>
      )}

      {generatedImages.length > 0 && (
        <div className="mt-4 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-700 text-sm flex items-center">
              <span className="mr-2">✅</span>
              Successfully generated {generatedImages.length} images
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {generatedImages.map((image, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div 
                  className="w-full h-32 rounded overflow-hidden mb-2"
                  dangerouslySetInnerHTML={{ __html: image.svg }}
                />
                <p className="text-xs text-gray-600 text-center">
                  Scene {image.sceneIndex + 1}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isGenerating && generatedImages.length === 0 && (
        <div className="mt-4 bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
          <PhotoIcon className="h-16 w-16 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-2">No images generated yet</p>
          <p className="text-sm text-gray-500">
            {scenes.length > 0 
              ? `Ready to generate ${scenes.length} images for your storybook`
              : 'Add scenes to generate images'}
          </p>
        </div>
      )}
    </div>
  );
};

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  onLoad,
  onError
}) => {
  const [imageState, setImageState] = useState<'loading' | 'success' | 'error' | 'demo'>('loading');
  const [svgContent, setSvgContent] = useState<string | null>(null);
  
  useEffect(() => {
    const checkImage = async () => {
      try {
        const response = await fetch(src);
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          // Demo response with SVG
          const data = await response.json();
          if (data.svg) {
            setSvgContent(data.svg);
            setImageState('demo');
          } else {
            setImageState('error');
          }
          return;
        }
        
        // Regular image file
        setImageState('success');
        onLoad?.();
      } catch (error) {
        console.log('Image load error:', error);
        setImageState('error');
        onError?.();
      }
    };
    
    checkImage();
  }, [src, onLoad, onError]);

  if (imageState === 'loading') {
    return (
      <div className={`${className} bg-gray-100 animate-pulse flex items-center justify-center`}>
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (imageState === 'demo' && svgContent) {
    return (
      <div 
        className={className}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  }

  if (imageState === 'error') {
    return (
      <div className={`${className} bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center`}>
        <div className="text-center p-4">
          <PhotoIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">{alt}</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onLoad={onLoad}
      onError={() => {
        setImageState('error');
        onError?.();
      }}
    />
  );
};

export default ImageGenerator;
