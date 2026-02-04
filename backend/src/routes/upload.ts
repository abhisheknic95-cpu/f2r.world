import express, { Request, Response, NextFunction } from 'express';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { productImageUpload, productVideoUpload } from '../config/multer';
import {
  uploadProductImages,
  uploadProductVideo,
  deleteUploadedFile,
  getUploadConfig,
} from '../controllers/uploadController';

const router = express.Router();

// Multer error handling middleware
const handleMulterError = (
  err: Error | null,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err) {
    if (err.message.includes('File too large')) {
      res.status(413).json({
        success: false,
        message: 'File size exceeds the maximum allowed limit',
        error: err.message,
      });
      return;
    }

    if (err.message.includes('Invalid file type')) {
      res.status(400).json({
        success: false,
        message: err.message,
      });
      return;
    }

    // Handle multer's built-in errors
    if ((err as any).code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        message: 'File size exceeds the maximum allowed limit (5MB for images, 50MB for video)',
      });
      return;
    }

    if ((err as any).code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 8 images allowed.',
      });
      return;
    }

    if ((err as any).code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'File upload error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
    return;
  }
  next();
};

// All routes require seller authentication
router.use(protect as any);
router.use(authorize('seller', 'admin') as any);

// Get upload configuration
router.get('/config', getUploadConfig as any);

// Upload product images (multiple files)
router.post(
  '/product-images',
  (req: Request, res: Response, next: NextFunction) => {
    productImageUpload.array('images', 8)(req, res, (err: any) => {
      if (err) {
        handleMulterError(err, req, res, next);
      } else {
        next();
      }
    });
  },
  uploadProductImages as any
);

// Upload product video (single file)
router.post(
  '/product-video',
  (req: Request, res: Response, next: NextFunction) => {
    productVideoUpload.single('video')(req, res, (err: any) => {
      if (err) {
        handleMulterError(err, req, res, next);
      } else {
        next();
      }
    });
  },
  uploadProductVideo as any
);

// Delete uploaded file
router.delete('/:publicId', deleteUploadedFile as any);

export default router;
