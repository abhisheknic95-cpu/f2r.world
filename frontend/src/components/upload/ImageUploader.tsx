'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';

interface ImageUploaderProps {
  images: string[];
  onChange: (urls: string[]) => void;
  minImages?: number;
  maxImages?: number;
  disabled?: boolean;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
}

interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  error?: string;
}

export default function ImageUploader({
  images,
  onChange,
  minImages = 3,
  maxImages = 8,
  disabled = false,
  onUploadStart,
  onUploadEnd,
}: ImageUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type: ${file.name}. Allowed: JPEG, PNG, WebP`;
    }

    if (file.size > maxSize) {
      return `File too large: ${file.name}. Maximum size: 5MB`;
    }

    return null;
  };

  const uploadFiles = async (files: File[]) => {
    if (disabled) return;

    const totalImages = images.length + files.length;
    if (totalImages > maxImages) {
      setError(`Maximum ${maxImages} images allowed. You can add ${maxImages - images.length} more.`);
      return;
    }

    // Validate files
    const validFiles: File[] = [];
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setError(null);
    onUploadStart?.();

    // Create uploading previews
    const newUploadingFiles: UploadingFile[] = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    try {
      const formData = new FormData();
      validFiles.forEach((file) => formData.append('images', file));

      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://f2rworld-production.up.railway.app/api';

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadingFiles((prev) =>
            prev.map((f) =>
              newUploadingFiles.find((nf) => nf.id === f.id)
                ? { ...f, progress }
                : f
            )
          );
        }
      });

      const response = await new Promise<{ success: boolean; data?: { urls: string[] }; message?: string }>((resolve, reject) => {
        xhr.open('POST', `${API_URL}/upload/product-images`);
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

      if (response.success && response.data?.urls) {
        // Add new URLs to images
        onChange([...images, ...response.data.urls]);

        // Clean up uploading files
        newUploadingFiles.forEach((f) => URL.revokeObjectURL(f.preview));
        setUploadingFiles((prev) =>
          prev.filter((f) => !newUploadingFiles.find((nf) => nf.id === f.id))
        );
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);

      // Mark files as failed
      setUploadingFiles((prev) =>
        prev.map((f) =>
          newUploadingFiles.find((nf) => nf.id === f.id)
            ? { ...f, error: errorMessage }
            : f
        )
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
      uploadFiles(files);
    },
    [images, maxImages, disabled]
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
      const files = e.target.files ? Array.from(e.target.files) : [];
      uploadFiles(files);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [images, maxImages, disabled]
  );

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const removeUploadingFile = (id: string) => {
    setUploadingFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    onChange(newImages);
  };

  const isValid = images.length >= minImages;
  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      {canAddMore && (
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
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium text-blue-600 dark:text-blue-400">
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              JPEG, PNG, WebP (max 5MB each)
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {images.length}/{maxImages} images • Minimum {minImages} required
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

      {/* Validation message */}
      {!isValid && images.length > 0 && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-600 dark:text-yellow-400 text-sm">
          Please upload at least {minImages} images. You have {images.length}.
        </div>
      )}

      {/* Uploaded images grid */}
      {(images.length > 0 || uploadingFiles.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* Uploaded images */}
          {images.map((url, index) => (
            <div
              key={url}
              className="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
            >
              <Image
                src={url}
                alt={`Product image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />

              {/* Main image badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                  Main
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {/* Move left */}
                {index > 0 && (
                  <button
                    onClick={() => moveImage(index, index - 1)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Move left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                {/* Remove */}
                <button
                  onClick={() => removeImage(index)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Move right */}
                {index < images.length - 1 && (
                  <button
                    onClick={() => moveImage(index, index + 1)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Move right"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Uploading files */}
          {uploadingFiles.map((file) => (
            <div
              key={file.id}
              className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
            >
              <Image
                src={file.preview}
                alt="Uploading"
                fill
                className="object-cover opacity-50"
                sizes="(max-width: 768px) 50vw, 25vw"
              />

              {/* Progress overlay */}
              {!file.error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 relative">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        className="text-gray-300"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={175.93}
                        strokeDashoffset={175.93 - (175.93 * file.progress) / 100}
                        className="text-blue-600 transition-all duration-300"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                      {file.progress}%
                    </span>
                  </div>
                </div>
              )}

              {/* Error overlay */}
              {file.error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/80 text-white p-2">
                  <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-xs text-center">Failed</span>
                  <button
                    onClick={() => removeUploadingFile(file.id)}
                    className="mt-2 text-xs underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        The first image will be used as the main product image. Drag images to reorder.
      </p>
    </div>
  );
}
