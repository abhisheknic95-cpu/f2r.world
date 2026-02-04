'use client';

import { useState, useCallback, useRef } from 'react';

interface VideoUploaderProps {
  video: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
}

interface UploadingVideo {
  file: File;
  preview: string;
  progress: number;
  error?: string;
}

export default function VideoUploader({
  video,
  onChange,
  disabled = false,
  onUploadStart,
  onUploadEnd,
}: VideoUploaderProps) {
  const [uploadingVideo, setUploadingVideo] = useState<UploadingVideo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type: ${file.name}. Allowed: MP4, WebM, MOV`;
    }

    if (file.size > maxSize) {
      return `File too large: ${file.name}. Maximum size: 50MB`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    if (disabled) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onUploadStart?.();

    const preview = URL.createObjectURL(file);
    setUploadingVideo({
      file,
      preview,
      progress: 0,
    });

    try {
      const formData = new FormData();
      formData.append('video', file);

      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://f2rworld-production.up.railway.app/api';

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadingVideo((prev) => (prev ? { ...prev, progress } : null));
        }
      });

      const response = await new Promise<{ success: boolean; data?: { url: string }; message?: string }>((resolve, reject) => {
        xhr.open('POST', `${API_URL}/upload/product-video`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.onload = () => {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch {
            reject(new Error('Invalid response'));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(formData);
      });

      if (response.success && response.data?.url) {
        onChange(response.data.url);
        URL.revokeObjectURL(preview);
        setUploadingVideo(null);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setUploadingVideo((prev) =>
        prev ? { ...prev, error: errorMessage } : null
      );
    } finally {
      onUploadEnd?.();
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        uploadFile(files[0]);
      }
    },
    [disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        uploadFile(files[0]);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [disabled]
  );

  const removeVideo = () => {
    onChange(null);
  };

  const cancelUpload = () => {
    if (uploadingVideo) {
      URL.revokeObjectURL(uploadingVideo.preview);
      setUploadingVideo(null);
    }
  };

  const hasVideo = video || uploadingVideo;

  return (
    <div className="space-y-4">
      {/* Dropzone (show when no video) */}
      {!hasVideo && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />

          <div className="flex flex-col items-center gap-2">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium text-blue-600 dark:text-blue-400">
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              MP4, WebM, MOV (max 50MB)
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Optional - Add a product video
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Uploaded video preview */}
      {video && !uploadingVideo && (
        <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <video
            src={video}
            controls
            className="w-full max-h-64 object-contain"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>

          {/* Remove button */}
          <button
            onClick={removeVideo}
            disabled={disabled}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
            title="Remove video"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Video badge */}
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
            Product Video
          </div>
        </div>
      )}

      {/* Uploading video preview */}
      {uploadingVideo && (
        <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <video
            src={uploadingVideo.preview}
            className="w-full max-h-64 object-contain opacity-50"
            muted
          />

          {/* Progress overlay */}
          {!uploadingVideo.error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
              <div className="w-24 h-24 relative">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-gray-300"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={251.33}
                    strokeDashoffset={251.33 - (251.33 * uploadingVideo.progress) / 100}
                    className="text-blue-600 transition-all duration-300"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-medium text-white">
                  {uploadingVideo.progress}%
                </span>
              </div>
              <p className="mt-2 text-sm text-white">Uploading video...</p>
            </div>
          )}

          {/* Error overlay */}
          {uploadingVideo.error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/80 text-white p-4">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-sm text-center mb-2">Upload failed</span>
              <button
                onClick={cancelUpload}
                className="px-4 py-2 bg-white text-red-500 rounded-lg text-sm font-medium hover:bg-gray-100"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Help text */}
      {!hasVideo && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          A product video can help customers understand your product better. This is optional.
        </p>
      )}
    </div>
  );
}
