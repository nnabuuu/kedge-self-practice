import React, { useState } from 'react';
import { Image, X, ZoomIn, ZoomOut } from 'lucide-react';

interface QuizImageDisplayProps {
  content: string;
  images?: string[];
  className?: string;
}

export const QuizImageDisplay: React.FC<QuizImageDisplayProps> = ({ 
  content, 
  images = [], 
  className = '' 
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Process content to replace image placeholders
  const processContent = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const regex = /\{\{img:(\d+)\}\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the image
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const imageIndex = parseInt(match[1], 10);
      const imageUrl = images[imageIndex];

      if (imageUrl && !imageErrors.has(imageIndex)) {
        // Add image component
        parts.push(
          <span key={`img-${match.index}`} className="inline-block align-middle mx-1">
            <img
              src={imageUrl}
              alt={`Image ${imageIndex + 1}`}
              className="inline-block max-h-32 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedImage(imageUrl)}
              onError={() => {
                setImageErrors(prev => new Set(prev).add(imageIndex));
              }}
            />
          </span>
        );
      } else {
        // Show placeholder for missing or errored images
        parts.push(
          <span 
            key={`placeholder-${match.index}`} 
            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm text-gray-500"
          >
            <Image className="w-4 h-4" />
            <span>图片 {imageIndex + 1}</span>
          </span>
        );
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  return (
    <>
      <div className={className}>
        {processContent(content)}
      </div>

      {/* Image modal for full-size view */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

// Utility function to check if content has images
export const hasImages = (content: string): boolean => {
  return /\{\{img:\d+\}\}/.test(content);
};

// Utility function to extract image indices from content
export const extractImageIndices = (content: string): number[] => {
  const indices: number[] = [];
  const regex = /\{\{img:(\d+)\}\}/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    indices.push(parseInt(match[1], 10));
  }
  
  return indices;
};