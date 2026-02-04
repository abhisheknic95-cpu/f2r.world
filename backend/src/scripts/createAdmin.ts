import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

// Admin user details
const adminUser = {
  name: 'Admin',
  email: 'admin@f2r.world',
  phone: '9899174731',
  password: 'Divyanshu@2026',
  role: 'admin',
  isActive: true,
  isVerified: true,
};

async function createAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get User model
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      phone: { type: String, unique: true },
      password: String,
      role: { type: String, enum: ['customer', 'seller', 'admin'], default: 'customer' },
      isActive: { type: Boolean, default: true },
      isVerified: { type: Boolean, default: false },
      otp: String,
      otpExpiry: Date,
      addresses: Array,
      wallet: { type: Number, default: 0 },
    }, { timestamps: true }));

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [
        { email: adminUser.email },
        { phone: adminUser.phone }
      ]
    });

    if (existingAdmin) {
      console.log('Admin user already exists. Updating to admin role...');
      existingAdmin.role = 'admin';
      existingAdmin.isVerified = true;
      existingAdmin.isActive = true;
      existingAdmin.password = await bcrypt.hash(adminUser.password, 12);
      await existingAdmin.save();
      console.log('Admin user updated successfully!');
      console.log('Email:', existingAdmin.email);
      console.log('Phone:', existingAdmin.phone);
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(adminUser.password, 12);

      // Create admin user
      const admin = await User.create({
        ...adminUser,
        password: hashedPassword,
      });

      console.log('Admin user created successfully!');
      console.log('Email:', admin.email);
      console.log('Phone:', admin.phone);
    }

    console.log('\n--- Admin Login Credentials ---');
    console.log('Phone: 9899174731');
    console.log('Password: Divyanshu@2026');
    console.log('--------------------------------');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

createAdminUser();
