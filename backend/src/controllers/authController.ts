import { Request, Response } from 'express';
import User from '../models/User';
import { generateToken, generateOTP } from '../utils/generateToken';
import { AuthRequest } from '../middleware/auth';

// @desc    Register user with phone and OTP
// @route   POST /api/auth/send-otp
export const sendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;

    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number is required' });
      return;
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user = await User.findOne({ phone });

    if (user) {
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
    } else {
      user = await User.create({
        phone,
        name: 'User',
        email: `${phone}@f2r.co.in`,
        otp,
        otpExpiry,
      });
    }

    // In production, send OTP via SMS service (MSG91, Twilio, etc.)
    // For now, we'll return it in response (remove in production with real SMS)
    console.log(`OTP for ${phone}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      // TODO: Remove this in production when SMS service is integrated
      otp: otp,
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      res.status(400).json({ success: false, message: 'Phone and OTP are required' });
      return;
    }

    const user = await User.findOne({ phone }).select('+otp +otpExpiry');

    if (!user) {
      res.status(400).json({ success: false, message: 'User not found' });
      return;
    }

    if (!user.otp || !user.otpExpiry) {
      res.status(400).json({ success: false, message: 'OTP not sent or expired' });
      return;
    }

    if (user.otp !== otp) {
      res.status(400).json({ success: false, message: 'Invalid OTP' });
      return;
    }

    if (new Date() > user.otpExpiry) {
      res.status(400).json({ success: false, message: 'OTP expired' });
      return;
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.isVerified = true;
    await user.save();

    const token = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Register seller
// @route   POST /api/auth/register-seller
export const registerSeller = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email or phone already registered' });
      return;
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'seller',
    });

    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register Seller Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Login seller/admin with email & password
// @route   POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.password) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ success: false, message: 'Account is deactivated' });
      return;
    }

    const token = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { name, email },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add/Update address
// @route   POST /api/auth/address
export const addAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, address, city, state, pincode, isDefault } = req.body;

    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      name,
      phone,
      address,
      city,
      state,
      pincode,
      isDefault: isDefault || user.addresses.length === 0,
    });

    await user.save();

    res.status(200).json({
      success: true,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error('Add Address Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete address
// @route   DELETE /api/auth/address/:addressId
export const deleteAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    user.addresses = user.addresses.filter(
      (addr) => addr._id?.toString() !== req.params.addressId
    );

    await user.save();

    res.status(200).json({
      success: true,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error('Delete Address Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc    Setup admin user (one-time setup)
// @route   POST /api/auth/setup-admin
export const setupAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { setupKey, name, email, phone, password } = req.body;

    // Security: Require a setup key to prevent unauthorized admin creation
    const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'F2R_ADMIN_SETUP_2024_SECURE';

    if (setupKey !== ADMIN_SETUP_KEY) {
      res.status(403).json({ success: false, message: 'Invalid setup key' });
      return;
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      // Update existing user to admin if phone matches
      const userByPhone = await User.findOne({ phone });
      if (userByPhone) {
        userByPhone.role = 'admin';
        userByPhone.name = name || userByPhone.name;
        userByPhone.email = email || userByPhone.email;
        userByPhone.password = password;
        userByPhone.isVerified = true;
        userByPhone.isActive = true;
        await userByPhone.save();

        res.status(200).json({
          success: true,
          message: 'User upgraded to admin successfully',
          user: {
            id: userByPhone._id,
            name: userByPhone.name,
            email: userByPhone.email,
            phone: userByPhone.phone,
            role: userByPhone.role,
          },
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: 'Admin already exists. Contact support to manage admin users.'
      });
      return;
    }

    // Check if user with this phone/email exists
    let user = await User.findOne({ $or: [{ email }, { phone }] });

    if (user) {
      // Upgrade existing user to admin
      user.role = 'admin';
      user.name = name || user.name;
      user.email = email;
      user.password = password;
      user.isVerified = true;
      user.isActive = true;
      await user.save();
    } else {
      // Create new admin user
      user = await User.create({
        name: name || 'Admin',
        email,
        phone,
        password,
        role: 'admin',
        isVerified: true,
        isActive: true,
      });
    }

    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Setup Admin Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
