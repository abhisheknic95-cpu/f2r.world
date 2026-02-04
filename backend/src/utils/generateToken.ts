import jwt from 'jsonwebtoken';
import { Response } from 'express';

export const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'f2r_secret_key_2024', {
    expiresIn: '30d',
  });
};

export const sendTokenResponse = (userId: string, statusCode: number, res: Response): void => {
  const token = generateToken(userId);

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
  });
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
