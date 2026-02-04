import PDFDocument from 'pdfkit';

interface OrderItem {
  name: string;
  size: string;
  color: string;
  quantity: number;
  mrp: number;
  finalPrice: number;
}

interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface Order {
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  shippingCharges: number;
  couponDiscount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: ShippingAddress;
  createdAt: Date;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
}

// Company Details from environment variables
const COMPANY_NAME = process.env.COMPANY_NAME || 'F2R Retail Private Limited';
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || 'Mumbai, Maharashtra, India';
const COMPANY_GST = process.env.COMPANY_GST || '27AABCF1234C1ZV';
const COMPANY_PAN = process.env.COMPANY_PAN || 'AABCF1234C';
const COMPANY_EMAIL = process.env.COMPANY_EMAIL || 'support@f2r.world';
const COMPANY_PHONE = process.env.COMPANY_PHONE || '+91-9899174731';

/**
 * Generate GST Invoice PDF for an order
 * Returns a buffer containing the PDF data
 */
export const generateInvoice = async (order: Order): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header with company logo area and title
      doc.rect(50, 50, 495, 80).stroke();

      // Company Name
      doc.fontSize(20).font('Helvetica-Bold').text(COMPANY_NAME, 60, 60, { width: 300 });

      // Tax Invoice Title
      doc.fontSize(14).font('Helvetica-Bold').text('TAX INVOICE', 400, 60, { width: 130, align: 'right' });

      // Company Details
      doc.fontSize(9).font('Helvetica');
      doc.text(COMPANY_ADDRESS, 60, 85);
      doc.text(`GSTIN: ${COMPANY_GST}`, 60, 98);
      doc.text(`Email: ${COMPANY_EMAIL} | Phone: ${COMPANY_PHONE}`, 60, 111);

      // Invoice Details Box
      doc.rect(50, 140, 247.5, 70).stroke();
      doc.rect(297.5, 140, 247.5, 70).stroke();

      // Left Box - Invoice Details
      doc.fontSize(10).font('Helvetica-Bold').text('Invoice Details', 60, 150);
      doc.fontSize(9).font('Helvetica');
      doc.text(`Invoice No: INV-${order.orderId}`, 60, 168);
      doc.text(`Invoice Date: ${formatDate(order.createdAt)}`, 60, 181);
      doc.text(`Order ID: ${order.orderId}`, 60, 194);

      // Right Box - Payment Details
      doc.fontSize(10).font('Helvetica-Bold').text('Payment Details', 307.5, 150);
      doc.fontSize(9).font('Helvetica');
      doc.text(`Payment Method: ${order.paymentMethod.toUpperCase()}`, 307.5, 168);
      doc.text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 307.5, 181);
      doc.text(`Place of Supply: ${order.shippingAddress.state}`, 307.5, 194);

      // Billing & Shipping Address
      doc.rect(50, 220, 247.5, 90).stroke();
      doc.rect(297.5, 220, 247.5, 90).stroke();

      // Billing Address (same as shipping for B2C)
      doc.fontSize(10).font('Helvetica-Bold').text('Bill To:', 60, 230);
      doc.fontSize(9).font('Helvetica');
      doc.text(order.customer.name, 60, 248);
      doc.text(order.shippingAddress.address, 60, 261, { width: 220 });
      doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`, 60, 287);
      doc.text(`Phone: ${order.shippingAddress.phone}`, 60, 300);

      // Shipping Address
      doc.fontSize(10).font('Helvetica-Bold').text('Ship To:', 307.5, 230);
      doc.fontSize(9).font('Helvetica');
      doc.text(order.shippingAddress.name, 307.5, 248);
      doc.text(order.shippingAddress.address, 307.5, 261, { width: 220 });
      doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`, 307.5, 287);
      doc.text(`Phone: ${order.shippingAddress.phone}`, 307.5, 300);

      // Items Table Header
      const tableTop = 330;
      const tableHeaders = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Taxable Amt', 'GST', 'Total'];
      const colWidths = [25, 150, 50, 35, 55, 70, 50, 60];
      let xPos = 50;

      // Header background
      doc.rect(50, tableTop, 495, 25).fill('#f0f0f0').stroke('#000');

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#000');
      tableHeaders.forEach((header, i) => {
        doc.text(header, xPos + 5, tableTop + 8, { width: colWidths[i] - 10, align: i > 2 ? 'right' : 'left' });
        xPos += colWidths[i];
      });

      // Items
      let yPos = tableTop + 30;
      let sNo = 1;

      order.items.forEach((item) => {
        const taxableAmount = item.finalPrice * item.quantity;
        const gstRate = 0.18; // 18% GST for footwear
        const gstAmount = taxableAmount * gstRate;
        const totalAmount = taxableAmount + gstAmount;

        xPos = 50;
        doc.fontSize(8).font('Helvetica').fillColor('#000');

        // Item row
        doc.rect(50, yPos - 5, 495, 35).stroke();

        doc.text(sNo.toString(), xPos + 5, yPos, { width: colWidths[0] - 10 });
        xPos += colWidths[0];

        doc.text(`${item.name}\nSize: ${item.size} | Color: ${item.color}`, xPos + 5, yPos - 3, { width: colWidths[1] - 10 });
        xPos += colWidths[1];

        doc.text('6403', xPos + 5, yPos + 5, { width: colWidths[2] - 10 }); // HSN Code for footwear
        xPos += colWidths[2];

        doc.text(item.quantity.toString(), xPos + 5, yPos + 5, { width: colWidths[3] - 10, align: 'right' });
        xPos += colWidths[3];

        doc.text(`₹${item.finalPrice.toFixed(2)}`, xPos + 5, yPos + 5, { width: colWidths[4] - 10, align: 'right' });
        xPos += colWidths[4];

        doc.text(`₹${taxableAmount.toFixed(2)}`, xPos + 5, yPos + 5, { width: colWidths[5] - 10, align: 'right' });
        xPos += colWidths[5];

        doc.text(`₹${gstAmount.toFixed(2)}`, xPos + 5, yPos + 5, { width: colWidths[6] - 10, align: 'right' });
        xPos += colWidths[6];

        doc.text(`₹${totalAmount.toFixed(2)}`, xPos + 5, yPos + 5, { width: colWidths[7] - 10, align: 'right' });

        yPos += 40;
        sNo++;
      });

      // Summary Section
      const summaryTop = yPos + 20;

      // Tax Breakdown Box
      doc.rect(50, summaryTop, 247.5, 80).stroke();
      doc.fontSize(10).font('Helvetica-Bold').text('Tax Breakdown', 60, summaryTop + 10);

      const totalTaxableAmount = order.subtotal / 1.18; // Reverse calculate taxable amount
      const cgst = (totalTaxableAmount * 0.09);
      const sgst = (totalTaxableAmount * 0.09);

      doc.fontSize(9).font('Helvetica');
      doc.text(`Taxable Amount: ₹${totalTaxableAmount.toFixed(2)}`, 60, summaryTop + 28);
      doc.text(`CGST @ 9%: ₹${cgst.toFixed(2)}`, 60, summaryTop + 43);
      doc.text(`SGST @ 9%: ₹${sgst.toFixed(2)}`, 60, summaryTop + 58);
      doc.text(`Total Tax: ₹${(cgst + sgst).toFixed(2)}`, 60, summaryTop + 73);

      // Order Summary Box
      doc.rect(297.5, summaryTop, 247.5, 80).stroke();
      doc.fontSize(10).font('Helvetica-Bold').text('Order Summary', 307.5, summaryTop + 10);

      doc.fontSize(9).font('Helvetica');
      doc.text(`Subtotal:`, 307.5, summaryTop + 28);
      doc.text(`₹${order.subtotal.toFixed(2)}`, 490, summaryTop + 28, { width: 50, align: 'right' });

      doc.text(`Shipping:`, 307.5, summaryTop + 43);
      doc.text(`₹${order.shippingCharges.toFixed(2)}`, 490, summaryTop + 43, { width: 50, align: 'right' });

      if (order.couponDiscount > 0) {
        doc.text(`Discount:`, 307.5, summaryTop + 58);
        doc.text(`-₹${order.couponDiscount.toFixed(2)}`, 490, summaryTop + 58, { width: 50, align: 'right' });
      }

      doc.font('Helvetica-Bold');
      doc.text(`Grand Total:`, 307.5, summaryTop + 73);
      doc.fontSize(11).text(`₹${order.total.toFixed(2)}`, 480, summaryTop + 73, { width: 60, align: 'right' });

      // Amount in Words
      const amountInWords = numberToWords(Math.round(order.total));
      doc.fontSize(9).font('Helvetica');
      doc.text(`Amount in Words: ${amountInWords} Rupees Only`, 50, summaryTop + 95);

      // Footer
      const footerTop = summaryTop + 120;
      doc.rect(50, footerTop, 495, 60).stroke();

      doc.fontSize(10).font('Helvetica-Bold').text('Terms & Conditions:', 60, footerTop + 10);
      doc.fontSize(8).font('Helvetica');
      doc.text('1. This is a computer-generated invoice and does not require a signature.', 60, footerTop + 25);
      doc.text('2. All disputes are subject to Mumbai jurisdiction.', 60, footerTop + 38);
      doc.text('3. For returns and refunds, please refer to our return policy at f2r.world/returns', 60, footerTop + 51);

      // Authorized Signatory
      doc.rect(400, footerTop, 145, 60).stroke();
      doc.fontSize(10).font('Helvetica-Bold').text('For ' + COMPANY_NAME.split(' ')[0], 410, footerTop + 10, { width: 125, align: 'center' });
      doc.fontSize(9).font('Helvetica').text('Authorized Signatory', 410, footerTop + 45, { width: 125, align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Format date to Indian format
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Convert number to words (Indian numbering system)
 */
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + ' ' + ones[n % 10] + ' ';
    return ones[Math.floor(n / 100)] + ' Hundred ' + convertLessThanThousand(n % 100);
  }

  let result = '';

  // Crores
  if (num >= 10000000) {
    result += convertLessThanThousand(Math.floor(num / 10000000)) + 'Crore ';
    num %= 10000000;
  }

  // Lakhs
  if (num >= 100000) {
    result += convertLessThanThousand(Math.floor(num / 100000)) + 'Lakh ';
    num %= 100000;
  }

  // Thousands
  if (num >= 1000) {
    result += convertLessThanThousand(Math.floor(num / 1000)) + 'Thousand ';
    num %= 1000;
  }

  // Remaining
  result += convertLessThanThousand(num);

  return result.trim();
}
