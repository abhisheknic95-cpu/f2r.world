import axios from 'axios';

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

let authToken: string | null = null;
let tokenExpiry: Date | null = null;

// Authenticate with Shiprocket
export const authenticateShiprocket = async (): Promise<string> => {
  // Return cached token if still valid
  if (authToken && tokenExpiry && new Date() < tokenExpiry) {
    return authToken;
  }

  try {
    const response = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    });

    authToken = response.data.token;
    // Token is valid for 10 days, we'll refresh after 9 days
    tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);

    return authToken!;
  } catch (error) {
    throw new Error('Failed to authenticate with Shiprocket');
  }
};

// Create shipment order
export const createShipment = async (orderData: {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_address: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_phone?: string;
  order_items: {
    name: string;
    sku: string;
    units: number;
    selling_price: number;
  }[];
  payment_method: 'Prepaid' | 'COD';
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}) => {
  const token = await authenticateShiprocket();

  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/orders/create/adhoc`,
      orderData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create shipment');
  }
};

// Generate AWB (Air Waybill)
export const generateAWB = async (shipmentId: number, courierId?: number) => {
  const token = await authenticateShiprocket();

  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/courier/assign/awb`,
      {
        shipment_id: shipmentId,
        courier_id: courierId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to generate AWB');
  }
};

// Request pickup
export const requestPickup = async (shipmentId: number) => {
  const token = await authenticateShiprocket();

  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/courier/generate/pickup`,
      {
        shipment_id: [shipmentId],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to request pickup');
  }
};

// Track shipment
export const trackShipment = async (awbCode: string) => {
  const token = await authenticateShiprocket();

  try {
    const response = await axios.get(
      `${SHIPROCKET_BASE_URL}/courier/track/awb/${awbCode}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to track shipment');
  }
};

// Check serviceability
export const checkServiceability = async (
  pickupPincode: string,
  deliveryPincode: string,
  weight: number,
  cod: boolean = false
) => {
  const token = await authenticateShiprocket();

  try {
    const response = await axios.get(
      `${SHIPROCKET_BASE_URL}/courier/serviceability/`,
      {
        params: {
          pickup_postcode: pickupPincode,
          delivery_postcode: deliveryPincode,
          weight: weight,
          cod: cod ? 1 : 0,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to check serviceability');
  }
};

// Cancel shipment
export const cancelShipment = async (awbs: string[]) => {
  const token = await authenticateShiprocket();

  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/orders/cancel/shipment/awbs`,
      {
        awbs: awbs,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to cancel shipment');
  }
};

// Get shipping label
export const getShippingLabel = async (shipmentId: number) => {
  const token = await authenticateShiprocket();

  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/courier/generate/label`,
      {
        shipment_id: [shipmentId],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to get shipping label');
  }
};

// Get invoice
export const getInvoice = async (orderIds: number[]) => {
  const token = await authenticateShiprocket();

  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/orders/print/invoice`,
      {
        ids: orderIds,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to get invoice');
  }
};
