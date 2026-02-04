import axios from 'axios';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Check if Cloudinary is configured
const isCloudinaryConfigured = (): boolean => {
  return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
};

// Generate Cloudinary signature for secure uploads
const generateSignature = (params: Record<string, string | number>): string => {
  const sortedKeys = Object.keys(params).sort();
  const signatureString = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto
    .createHash('sha1')
    .update(signatureString + CLOUDINARY_API_SECRET)
    .digest('hex');
};

// Upload result interface
export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  resourceType: 'image' | 'video';
  thumbnailUrl?: string;
}

// Save file locally (for development)
const saveFileLocally = async (
  buffer: Buffer,
  filename: string,
  folder: string
): Promise<string> => {
  const uploadsDir = path.join(process.cwd(), 'uploads', folder);

  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, buffer);

  // Return localhost URL
  const port = process.env.PORT || 5000;
  return `http://localhost:${port}/uploads/${folder}/${filename}`;
};

// Upload to Cloudinary
const uploadToCloudinaryAPI = async (
  buffer: Buffer,
  folder: string,
  resourceType: 'image' | 'video',
  publicId?: string
): Promise<UploadResult> => {
  const timestamp = Math.round(Date.now() / 1000);

  const params: Record<string, string | number> = {
    folder: `f2r/${folder}`,
    timestamp,
    ...(resourceType === 'image' && {
      transformation: 'q_auto,f_auto',
    }),
    ...(publicId && { public_id: publicId }),
  };

  const signature = generateSignature(params);

  // Convert buffer to base64 data URI for Cloudinary upload
  const base64Data = buffer.toString('base64');
  const dataUri = `data:${resourceType === 'image' ? 'image/jpeg' : 'video/mp4'};base64,${base64Data}`;

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  const response = await axios.post(uploadUrl, {
    file: dataUri,
    api_key: CLOUDINARY_API_KEY!,
    timestamp: timestamp.toString(),
    signature,
    folder: `f2r/${folder}`,
    ...(resourceType === 'image' && { transformation: 'q_auto,f_auto' }),
    ...(publicId && { public_id: publicId }),
  }, {
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const result: UploadResult = {
    url: response.data.secure_url,
    publicId: response.data.public_id,
    width: response.data.width,
    height: response.data.height,
    format: response.data.format,
    resourceType,
  };

  // Generate thumbnail URL for videos
  if (resourceType === 'video') {
    result.thumbnailUrl = response.data.secure_url.replace('/video/', '/video/').replace(/\.[^.]+$/, '.jpg');
  }

  return result;
};

// Main upload function - handles both development and production
export const uploadFile = async (
  buffer: Buffer,
  originalName: string,
  folder: string,
  resourceType: 'image' | 'video'
): Promise<UploadResult> => {
  const isProduction = process.env.NODE_ENV === 'production';
  const timestamp = Date.now();
  const ext = path.extname(originalName);
  const filename = `${timestamp}-${crypto.randomBytes(8).toString('hex')}${ext}`;

  if (isProduction && isCloudinaryConfigured()) {
    // Upload to Cloudinary in production
    return uploadToCloudinaryAPI(buffer, folder, resourceType, filename.replace(ext, ''));
  } else {
    // Save locally in development
    const url = await saveFileLocally(buffer, filename, folder);
    return {
      url,
      publicId: `local_${folder}_${filename}`,
      resourceType,
    };
  }
};

// Upload multiple images
export const uploadMultipleImages = async (
  files: Express.Multer.File[],
  vendorId: string
): Promise<UploadResult[]> => {
  const folder = `products/${vendorId}/images`;

  const uploadPromises = files.map((file) =>
    uploadFile(file.buffer, file.originalname, folder, 'image')
  );

  return Promise.all(uploadPromises);
};

// Upload video
export const uploadVideo = async (
  file: Express.Multer.File,
  vendorId: string
): Promise<UploadResult> => {
  const folder = `products/${vendorId}/videos`;
  return uploadFile(file.buffer, file.originalname, folder, 'video');
};

// Delete from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  // Skip deletion for local files
  if (publicId.startsWith('local_')) {
    // Extract file path and delete locally
    const parts = publicId.replace('local_', '').split('_');
    const folder = parts.slice(0, -1).join('/');
    const filename = parts[parts.length - 1];
    const filePath = path.join(process.cwd(), 'uploads', folder, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  }

  if (!isCloudinaryConfigured()) {
    console.warn('Cloudinary not configured, skipping deletion');
    return false;
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const params = {
      public_id: publicId,
      timestamp,
    };

    const signature = generateSignature(params);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        public_id: publicId,
        api_key: CLOUDINARY_API_KEY,
        timestamp,
        signature,
      }
    );

    return response.data.result === 'ok';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

// Get optimized image URL with transformations
export const getOptimizedImageUrl = (
  url: string,
  width?: number,
  height?: number,
  quality?: number
): string => {
  if (!url.includes('cloudinary.com')) {
    return url; // Return as-is for local URLs
  }

  const transformations = [];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (quality) transformations.push(`q_${quality}`);
  transformations.push('c_fill', 'f_auto');

  // Insert transformations into Cloudinary URL
  return url.replace('/upload/', `/upload/${transformations.join(',')}/`);
};

export default {
  uploadFile,
  uploadMultipleImages,
  uploadVideo,
  deleteFromCloudinary,
  getOptimizedImageUrl,
  isCloudinaryConfigured,
};
