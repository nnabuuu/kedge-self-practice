import React, { useState } from 'react';
import { Image, X, ZoomIn, ZoomOut } from 'lucide-react';
import { getAuthToken as getApiAuthToken } from '../services/api';

interface QuizImageDisplayProps {
  content: string;
  images?: string[]; // Legacy: array of URLs by index (for {{img:N}} format)
  imageMapping?: Record<string, string>; // New: UUID to URL mapping (for {{image:uuid}} format)
  className?: string;
}

export const QuizImageDisplay: React.FC<QuizImageDisplayProps> = ({ 
  content, 
  images = [],
  imageMapping = {},
  className = '' 
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  // Debug logging
  React.useEffect(() => {
    if (content && (content.includes('{{image:') || content.includes('{{img:'))) {
      console.log('=== QuizImageDisplay Debug ===');
      console.log('Content:', content);
      console.log('Images (legacy):', images);
      console.log('Image Mapping (UUID):', imageMapping);
      console.log('Has UUID placeholders:', /\{\{image:[^}]+\}\}/.test(content));
      console.log('Has legacy placeholders:', /\{\{img:\d+\}\}/.test(content));
    }
  }, [content, images, imageMapping]);

  // Helper function to get auth token for protected image requests
  const getAuthToken = (): string | null => {
    // Use the auth token from the API service (in-memory storage)
    return getApiAuthToken() || 
           localStorage.getItem('jwt_token') || 
           localStorage.getItem('token') || 
           sessionStorage.getItem('jwt_token') ||
           sessionStorage.getItem('token');
  };

  // Helper function to construct authenticated image URL
  const getImageUrl = (baseUrl: string): string => {
    // Construct full URL if it's a relative path
    let fullUrl = baseUrl;
    if (baseUrl.startsWith('/')) {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/v1';
      // Remove /v1 from base URL since our paths already include it
      const cleanBase = apiBase.replace(/\/v1$/, '').replace(/\/$/, '');
      fullUrl = cleanBase + baseUrl;
    }
    
    const token = getAuthToken();
    if (token && fullUrl.includes('/attachments/')) {
      // Add token as query parameter for protected endpoints
      const separator = fullUrl.includes('?') ? '&' : '?';
      return `${fullUrl}${separator}token=${encodeURIComponent(token)}`;
    }
    return fullUrl;
  };

  // Process content to replace image placeholders
  const processContent = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // First, handle new UUID-based format: {{image:uuid}}
    const uuidRegex = /\{\{image:([^}]+)\}\}/g;
    let uuidMatch;
    const processedRanges: Array<{start: number, end: number}> = [];

    while ((uuidMatch = uuidRegex.exec(text)) !== null) {
      const uuid = uuidMatch[1];
      const imageUrl = imageMapping[uuid];
      
      // Add text before the image
      if (uuidMatch.index > lastIndex) {
        parts.push(text.substring(lastIndex, uuidMatch.index));
      }

      if (imageUrl && !imageErrors.has(uuid)) {
        const authenticatedUrl = getImageUrl(imageUrl);
        // Add image component
        parts.push(
          <span key={`uuid-img-${uuidMatch.index}`} className="inline-block align-middle mx-1 my-2">
            <img
              src={authenticatedUrl}
              alt={`Image ${uuid.substring(0, 8)}`}
              className="inline-block max-h-40 max-w-full rounded border shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedImage(authenticatedUrl)}
              onError={() => {
                console.error(`Failed to load image: ${authenticatedUrl}`);
                setImageErrors(prev => new Set(prev).add(uuid));
              }}
            />
          </span>
        );
      } else {
        // Show placeholder for missing or errored images
        parts.push(
          <span 
            key={`uuid-placeholder-${uuidMatch.index}`} 
            className="inline-flex items-center gap-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-600 mx-1"
          >
            <Image className="w-4 h-4" />
            <span>图片 {uuid.substring(0, 8)}</span>
          </span>
        );
      }

      processedRanges.push({start: uuidMatch.index, end: uuidRegex.lastIndex});
      lastIndex = uuidRegex.lastIndex;
    }

    // Then handle legacy numbered format: {{img:N}} (only in unprocessed ranges)
    if (images.length > 0) {
      const legacyRegex = /\{\{img:(\d+)\}\}/g;
      let legacyMatch;
      let tempLastIndex = 0;
      const tempParts: React.ReactNode[] = [];

      // Only process text that wasn't already processed by UUID regex
      const unprocessedText = processedRanges.length > 0 ? text : text;
      
      while ((legacyMatch = legacyRegex.exec(unprocessedText)) !== null) {
        // Check if this range was already processed
        const isInProcessedRange = processedRanges.some(range => 
          legacyMatch.index >= range.start && legacyMatch.index < range.end
        );
        
        if (isInProcessedRange) continue;

        // Add text before the image
        if (legacyMatch.index > tempLastIndex) {
          tempParts.push(unprocessedText.substring(tempLastIndex, legacyMatch.index));
        }

        const imageIndex = parseInt(legacyMatch[1], 10);
        const imageUrl = images[imageIndex];

        if (imageUrl && !imageErrors.has(imageIndex.toString())) {
          const authenticatedUrl = getImageUrl(imageUrl);
          // Add image component
          tempParts.push(
            <span key={`legacy-img-${legacyMatch.index}`} className="inline-block align-middle mx-1 my-2">
              <img
                src={authenticatedUrl}
                alt={`Image ${imageIndex + 1}`}
                className="inline-block max-h-40 max-w-full rounded border shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedImage(authenticatedUrl)}
                onError={() => {
                  setImageErrors(prev => new Set(prev).add(imageIndex.toString()));
                }}
              />
            </span>
          );
        } else {
          // Show placeholder for missing or errored images
          tempParts.push(
            <span 
              key={`legacy-placeholder-${legacyMatch.index}`} 
              className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 rounded text-sm text-gray-500 mx-1"
            >
              <Image className="w-4 h-4" />
              <span>图片 {imageIndex + 1}</span>
            </span>
          );
        }

        tempLastIndex = legacyRegex.lastIndex;
      }

      // If legacy processing was needed and no UUID processing happened
      if (tempParts.length > 0 && processedRanges.length === 0) {
        // Add remaining text
        if (tempLastIndex < unprocessedText.length) {
          tempParts.push(unprocessedText.substring(tempLastIndex));
        }
        return tempParts.length > 0 ? tempParts : [text];
      }
    }

    // Add remaining text for UUID processing
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

// Utility function to check if content has images (both formats)
export const hasImages = (content: string): boolean => {
  return /\{\{img:\d+\}\}/.test(content) || /\{\{image:[^}]+\}\}/.test(content);
};

// Utility function to extract image indices from content (legacy format)
export const extractImageIndices = (content: string): number[] => {
  const indices: number[] = [];
  const regex = /\{\{img:(\d+)\}\}/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    indices.push(parseInt(match[1], 10));
  }
  
  return indices;
};

// Utility function to extract image UUIDs from content (new format)
export const extractImageUUIDs = (content: string): string[] => {
  const uuids: string[] = [];
  const regex = /\{\{image:([^}]+)\}\}/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    uuids.push(match[1]);
  }
  
  return uuids;
};

// Utility function to create image mapping from backend response
export const createImageMapping = (extractedImages?: Array<{id: string; url: string}>): Record<string, string> => {
  if (!extractedImages) return {};
  
  const mapping: Record<string, string> = {};
  extractedImages.forEach(image => {
    mapping[image.id] = image.url;
  });
  
  return mapping;
};