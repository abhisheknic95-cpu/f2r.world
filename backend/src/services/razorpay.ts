import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay only if credentials are available
let razorpay: Razorpay | null = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('Razorpay credentials not configured. Payment features will be disabled.');
}

export const createRazorpayOrder = async (amount: number, orderId: string) => {
  if (!razorpay) {
    throw new Error('Payment service not configured');
  }

  const options = {
    amount: amount * 100, // Razorpay expects amount in paise
    currency: 'INR',
    receipt: orderId,
    payment_capture: 1,
  };

  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    throw error;
  }
};

export const verifyRazorpaySignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean => {
  const sign = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSign = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(sign)
    .digest('hex');

  return expectedSign === razorpaySignature;
};

export const fetchPaymentDetails = async (paymentId: string) => {
  if (!razorpay) {
    throw new Error('Payment service not configured');
  }

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    throw error;
  }
};

export const initiateRefund = async (paymentId: string, amount: number) => {
  if (!razorpay) {
    throw new Error('Payment service not configured');
  }

  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount * 100,
    });
    return refund;
  } catch (error) {
    throw error;
  }
};

export default razorpay;
