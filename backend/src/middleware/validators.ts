import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware to handle validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg,
      })),
    });
    return;
  }
  next();
};

// Phone number validation (Indian phone numbers)
export const validatePhone = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid 10-digit Indian phone number'),
  handleValidationErrors,
];

// OTP validation
export const validateOTP = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid 10-digit Indian phone number'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  handleValidationErrors,
];

// Login validation
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

// Seller registration validation
export const validateSellerRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid 10-digit Indian phone number'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  handleValidationErrors,
];

// Order creation validation
export const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('items.*.quantity')
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10'),
  body('items.*.size')
    .trim()
    .notEmpty()
    .withMessage('Size is required'),
  body('items.*.color')
    .trim()
    .notEmpty()
    .withMessage('Color is required'),
  body('shippingAddress.name')
    .trim()
    .notEmpty()
    .withMessage('Shipping address name is required'),
  body('shippingAddress.phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid shipping phone number'),
  body('shippingAddress.address')
    .trim()
    .notEmpty()
    .withMessage('Shipping address is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('shippingAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('shippingAddress.pincode')
    .matches(/^\d{6}$/)
    .withMessage('Please enter a valid 6-digit pincode'),
  body('paymentMethod')
    .isIn(['cod', 'razorpay'])
    .withMessage('Payment method must be cod or razorpay'),
  body('couponCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Coupon code is too long'),
  handleValidationErrors,
];

// Payment verification validation
export const validatePaymentVerification = [
  body('orderId')
    .trim()
    .notEmpty()
    .withMessage('Order ID is required'),
  body('razorpayPaymentId')
    .trim()
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),
  body('razorpaySignature')
    .trim()
    .notEmpty()
    .withMessage('Razorpay signature is required'),
  handleValidationErrors,
];

// Review validation
export const validateReview = [
  body('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('orderId')
    .trim()
    .notEmpty()
    .withMessage('Order ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title must be less than 100 characters'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment must be less than 1000 characters'),
  body('images')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 images allowed'),
  handleValidationErrors,
];

// Address validation
export const validateAddress = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid 10-digit Indian phone number'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('pincode')
    .matches(/^\d{6}$/)
    .withMessage('Please enter a valid 6-digit pincode'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
  handleValidationErrors,
];

// Profile update validation
export const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  handleValidationErrors,
];

// MongoDB ID param validation
export const validateMongoId = (paramName: string) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
  handleValidationErrors,
];

// Pagination query validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

// Product search validation
export const validateProductSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query is too long'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  query('category')
    .optional()
    .trim(),
  query('brand')
    .optional()
    .trim(),
  query('sort')
    .optional()
    .isIn(['price_asc', 'price_desc', 'newest', 'rating', 'popularity'])
    .withMessage('Invalid sort option'),
  handleValidationErrors,
];

// Cart item validation
export const validateCartItem = [
  body('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('size')
    .trim()
    .notEmpty()
    .withMessage('Size is required'),
  body('color')
    .trim()
    .notEmpty()
    .withMessage('Color is required'),
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10'),
  handleValidationErrors,
];

// Wishlist validation
export const validateWishlistItem = [
  body('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  handleValidationErrors,
];

// Admin setup validation
export const validateAdminSetup = [
  body('setupKey')
    .trim()
    .notEmpty()
    .withMessage('Setup key is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid 10-digit Indian phone number'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  handleValidationErrors,
];
