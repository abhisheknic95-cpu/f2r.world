import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export const createRazorpayOrder = async (amount: number, orderId: string) => {
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
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    throw error;
  }
};

export const initiateRefund = async (paymentId: string, amount: number) => {
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
