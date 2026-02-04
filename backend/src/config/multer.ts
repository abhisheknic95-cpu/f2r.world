import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

// File size limits
const IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5MB per image
const VIDEO_MAX_SIZE = 50 * 1024 * 1024; // 50MB for video

// Image file filter
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: jpeg, jpg, png, webp`));
  }
};

// Video file filter
const videoFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: mp4, webm, mov`));
  }
};

// Combined file filter for images and videos
const combinedFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype) || ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: jpeg, jpg, png, webp, mp4, webm, mov`));
  }
};

// Multer configuration for product images
export const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: IMAGE_MAX_SIZE,
    files: 8, // Max 8 images
  },
  fileFilter: imageFileFilter,
});

// Multer configuration for product videos
export const productVideoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: VIDEO_MAX_SIZE,
    files: 1, // Single video only
  },
  fileFilter: videoFileFilter,
});

// Combined upload for both images and video
export const combinedUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: VIDEO_MAX_SIZE, // Use larger limit for video
    files: 9, // 8 images + 1 video
  },
  fileFilter: combinedFileFilter,
});

// Export constants for use in controllers
export const UPLOAD_CONSTANTS = {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  IMAGE_MAX_SIZE,
  VIDEO_MAX_SIZE,
  MIN_PRODUCT_IMAGES: 3,
  MAX_PRODUCT_IMAGES: 8,
};

export default {
  productImageUpload,
  productVideoUpload,
  combinedUpload,
  UPLOAD_CONSTANTS,
};
