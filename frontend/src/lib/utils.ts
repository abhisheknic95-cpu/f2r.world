import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function calculateDiscount(mrp: number, sellingPrice: number): number {
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-100',
    confirmed: 'text-blue-600 bg-blue-100',
    packaging: 'text-purple-600 bg-purple-100',
    ready_to_pickup: 'text-indigo-600 bg-indigo-100',
    picked_up: 'text-cyan-600 bg-cyan-100',
    in_transit: 'text-orange-600 bg-orange-100',
    delivered: 'text-green-600 bg-green-100',
    cancelled: 'text-red-600 bg-red-100',
    rto: 'text-red-600 bg-red-100',
    lost: 'text-gray-600 bg-gray-100',
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export const categories = [
  { id: 'sports_shoes', name: 'Sports Shoes', icon: '👟' },
  { id: 'sneaker', name: 'Sneakers', icon: '👞' },
  { id: 'sandals', name: 'Sandals', icon: '🩴' },
  { id: 'slipper', name: 'Slippers', icon: '🥿' },
  { id: 'formal', name: 'Formal', icon: '👔' },
  { id: 'casual', name: 'Casual', icon: '👣' },
  { id: 'hawaii', name: 'Hawaii', icon: '🏝️' },
];

export const sizes = ['6', '7', '8', '9', '10', '11', '12'];

export const colors = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Green', hex: '#008000' },
];

export const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh',
];
