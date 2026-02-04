import axios from 'axios';

interface MSG91Response {
  type: string;
  message: string;
}

/**
 * Send OTP via MSG91 SMS service
 * In development mode, just logs the OTP to console
 * In production, sends actual SMS via MSG91
 */
export const sendOTPViaSMS = async (phone: string, otp: string): Promise<boolean> => {
  // In development mode, just log the OTP
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV MODE] OTP for ${phone}: ${otp}`);
    return true;
  }

  const apiKey = process.env.MSG91_API_KEY;
  const senderId = process.env.MSG91_SENDER_ID || 'F2RMKT';
  const templateId = process.env.MSG91_TEMPLATE_ID;

  // If MSG91 credentials are not configured, fall back to console log
  if (!apiKey || !templateId) {
    console.log(`[SMS NOT CONFIGURED] OTP for ${phone}: ${otp}`);
    console.warn('MSG91 API key or template ID not configured. SMS not sent.');
    return true; // Return true to not block the flow
  }

  try {
    // MSG91 Send OTP API
    const response = await axios.post<MSG91Response>(
      'https://api.msg91.com/api/v5/otp',
      null,
      {
        params: {
          authkey: apiKey,
          template_id: templateId,
          mobile: `91${phone}`,
          otp: otp,
          sender: senderId,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.type === 'success') {
      console.log(`SMS sent successfully to ${phone}`);
      return true;
    } else {
      console.error('MSG91 Error:', response.data.message);
      return false;
    }
  } catch (error: any) {
    console.error('SMS Send Error:', error.response?.data || error.message);
    // Don't throw - let the OTP flow continue even if SMS fails
    return false;
  }
};

/**
 * Send transactional SMS via MSG91
 * For order confirmations, shipping updates, etc.
 */
export const sendTransactionalSMS = async (
  phone: string,
  templateId: string,
  variables: Record<string, string>
): Promise<boolean> => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV MODE] Transactional SMS to ${phone}:`, variables);
    return true;
  }

  const apiKey = process.env.MSG91_API_KEY;
  const senderId = process.env.MSG91_SENDER_ID || 'F2RMKT';

  if (!apiKey) {
    console.warn('MSG91 API key not configured. SMS not sent.');
    return false;
  }

  try {
    // Build dynamic template variables
    const body = {
      flow_id: templateId,
      sender: senderId,
      mobiles: `91${phone}`,
      ...variables,
    };

    const response = await axios.post(
      'https://api.msg91.com/api/v5/flow',
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          authkey: apiKey,
        },
      }
    );

    if (response.data.type === 'success') {
      console.log(`Transactional SMS sent successfully to ${phone}`);
      return true;
    } else {
      console.error('MSG91 Error:', response.data.message);
      return false;
    }
  } catch (error: any) {
    console.error('Transactional SMS Error:', error.response?.data || error.message);
    return false;
  }
};

/**
 * Send order confirmation SMS
 */
export const sendOrderConfirmationSMS = async (
  phone: string,
  orderId: string,
  total: number
): Promise<boolean> => {
  const templateId = process.env.MSG91_ORDER_TEMPLATE_ID;

  if (!templateId) {
    console.log(`[SMS TEMPLATE NOT SET] Order confirmation for ${phone}: Order ${orderId}, Total: ₹${total}`);
    return true;
  }

  return sendTransactionalSMS(phone, templateId, {
    order_id: orderId,
    amount: total.toString(),
  });
};

/**
 * Send shipping update SMS
 */
export const sendShippingUpdateSMS = async (
  phone: string,
  orderId: string,
  status: string,
  trackingUrl?: string
): Promise<boolean> => {
  const templateId = process.env.MSG91_SHIPPING_TEMPLATE_ID;

  if (!templateId) {
    console.log(`[SMS TEMPLATE NOT SET] Shipping update for ${phone}: Order ${orderId}, Status: ${status}`);
    return true;
  }

  return sendTransactionalSMS(phone, templateId, {
    order_id: orderId,
    status: status,
    tracking_url: trackingUrl || '',
  });
};

/**
 * Send delivery confirmation SMS
 */
export const sendDeliveryConfirmationSMS = async (
  phone: string,
  orderId: string
): Promise<boolean> => {
  const templateId = process.env.MSG91_DELIVERY_TEMPLATE_ID;

  if (!templateId) {
    console.log(`[SMS TEMPLATE NOT SET] Delivery confirmation for ${phone}: Order ${orderId}`);
    return true;
  }

  return sendTransactionalSMS(phone, templateId, {
    order_id: orderId,
  });
};
