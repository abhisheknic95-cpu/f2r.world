import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Vendor from '../models/Vendor';
import {
  uploadMultipleImages,
  uploadVideo,
  deleteFromCloudinary,
  UploadResult,
} from '../services/cloudinary';
import { UPLOAD_CONSTANTS } from '../config/multer';

// @desc    Upload product images
// @route   POST /api/upload/product-images
// @access  Private (Seller only)
export const uploadProductImages = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];

    // Validate minimum images
    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No images provided',
      });
      return;
    }

    // Get vendor details for folder organization
    const vendor = await Vendor.findOne({ user: req.user?._id });

    if (!vendor) {
      res.status(403).json({
        success: false,
        message: 'Vendor profile not found. Please complete seller registration.',
      });
      return;
    }

    if (!vendor.isApproved) {
      res.status(403).json({
        success: false,
        message: 'Your vendor account is pending approval. You cannot upload products yet.',
      });
      return;
    }

    // Upload images
    const uploadResults: UploadResult[] = await uploadMultipleImages(
      files,
      vendor._id.toString()
    );

    // Extract URLs for response
    const urls = uploadResults.map((result) => result.url);
    const publicIds = uploadResults.map((result) => result.publicId);

    res.status(200).json({
      success: true,
      message: `${files.length} image(s) uploaded successfully`,
      data: {
        urls,
        publicIds,
        count: files.length,
      },
    });
  } catch (error) {
    console.error('Error uploading product images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

// @desc    Upload product video
// @route   POST /api/upload/product-video
// @access  Private (Seller only)
export const uploadProductVideo = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'No video provided',
      });
      return;
    }

    // Get vendor details
    const vendor = await Vendor.findOne({ user: req.user?._id });

    if (!vendor) {
      res.status(403).json({
        success: false,
        message: 'Vendor profile not found. Please complete seller registration.',
      });
      return;
    }

    if (!vendor.isApproved) {
      res.status(403).json({
        success: false,
        message: 'Your vendor account is pending approval. You cannot upload products yet.',
      });
      return;
    }

    // Upload video
    const uploadResult = await uploadVideo(file, vendor._id.toString());

    res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        thumbnailUrl: uploadResult.thumbnailUrl,
      },
    });
  } catch (error) {
    console.error('Error uploading product video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload video',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

// @desc    Delete uploaded file
// @route   DELETE /api/upload/:publicId
// @access  Private (Seller only)
export const deleteUploadedFile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const publicId = req.params.publicId as string;

    if (!publicId) {
      res.status(400).json({
        success: false,
        message: 'Public ID is required',
      });
      return;
    }

    // Verify vendor owns this file (basic check - publicId contains vendorId)
    const vendor = await Vendor.findOne({ user: req.user?._id });

    if (!vendor) {
      res.status(403).json({
        success: false,
        message: 'Vendor profile not found',
      });
      return;
    }

    // Check if publicId contains vendor's ID (for security)
    const vendorIdStr = vendor._id.toString();
    const decodedPublicId = decodeURIComponent(publicId);

    if (!decodedPublicId.includes(vendorIdStr) && !decodedPublicId.startsWith('local_')) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to delete this file',
      });
      return;
    }

    const deleted = await deleteFromCloudinary(decodedPublicId);

    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'File deleted successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete file',
      });
    }
  } catch (error) {
    console.error('Error deleting uploaded file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

// @desc    Get upload configuration (for frontend)
// @route   GET /api/upload/config
// @access  Private (Seller only)
export const getUploadConfig = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: {
        allowedImageTypes: UPLOAD_CONSTANTS.ALLOWED_IMAGE_TYPES,
        allowedVideoTypes: UPLOAD_CONSTANTS.ALLOWED_VIDEO_TYPES,
        maxImageSize: UPLOAD_CONSTANTS.IMAGE_MAX_SIZE,
        maxVideoSize: UPLOAD_CONSTANTS.VIDEO_MAX_SIZE,
        minProductImages: UPLOAD_CONSTANTS.MIN_PRODUCT_IMAGES,
        maxProductImages: UPLOAD_CONSTANTS.MAX_PRODUCT_IMAGES,
      },
    });
  } catch (error) {
    console.error('Error getting upload config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upload configuration',
    });
  }
};
