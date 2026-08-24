import nodemailer from 'nodemailer';
import 'dotenv/config';

let testAccount = null;

/**
 * Creates and returns a nodemailer transporter.
 * If SMTP_HOST and SMTP_USER are defined, uses real SMTP.
 * Otherwise, generates a free Ethereal test account on the fly for testing.
 */
async function getTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: Test SMTP account via Ethereal (no config required to test)
  if (!testAccount) {
    console.log('ℹ️  No custom SMTP provided. Creating temporary Ethereal test mailer...');
    testAccount = await nodemailer.createTestAccount();
  }

  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

/**
 * Generate a clean, responsive HTML email template for GreenFibre Purchase Orders
 */
function renderPoEmailHtml({ vendorName, poDetails }) {
  const {
    poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    sku = 'N/A',
    qty = 0,
    rate = 0,
    creditDays = 30,
    delivery = 'Standard Lead Time',
    notes = '',
  } = poDetails || {};

  const totalValue = (Number(qty) || 0) * (Number(rate) || 0);
  const formattedTotal = totalValue.toLocaleString('en-IN');
  const formattedQty = Number(qty || 0).toLocaleString('en-IN');
  const issueDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purchase Order - ${poNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f8f5; margin: 0; padding: 24px; color: #16231d; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e7e0; overflow: hidden; box-shadow: 0 4px 12px rgba(20, 35, 26, 0.05); }
    .header { background: #1f6e4c; color: #ffffff; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .header p { margin: 4px 0 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px; }
    .greeting { font-size: 16px; margin-bottom: 20px; }
    .po-badge { display: inline-block; background: #e7f2ec; color: #14513a; font-weight: 600; padding: 4px 10px; border-radius: 6px; font-size: 13px; margin-bottom: 16px; }
    .table-box { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
    .table-box th { background: #f6f8f5; color: #5b6b62; text-align: left; padding: 10px 14px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e7e0; }
    .table-box td { padding: 12px 14px; border-bottom: 1px solid #f0f3ef; }
    .table-box .num { text-align: right; font-family: monospace, sans-serif; }
    .total-row { background: #f6f8f5; font-weight: 700; }
    .total-row td { border-top: 2px solid #e2e7e0; color: #14513a; font-size: 16px; }
    .meta-grid { display: table; width: 100%; margin: 16px 0; }
    .meta-col { display: table-cell; width: 50%; vertical-align: top; font-size: 13px; line-height: 1.6; }
    .notes-box { background: #fbf1df; border-left: 4px solid #b9791e; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #5f3e0f; margin-top: 20px; }
    .footer { padding: 24px 32px; background: #f9faf8; border-top: 1px solid #e2e7e0; font-size: 12px; color: #5b6b62; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Green Fibre Procurement</h1>
      <p>Official Purchase Order Request</p>
    </div>

    <div class="content">
      <div class="po-badge">${poNumber} · Date: ${issueDate}</div>
      <p class="greeting">Dear <strong>${vendorName || 'Valued Vendor'}</strong>,</p>
      <p style="font-size: 14px; color: #5b6b62; line-height: 1.5;">
        Please find below the purchase order requirements for the listed items. Kindly confirm acknowledgment and planned delivery timeline.
      </p>

      <table class="table-box">
        <thead>
          <tr>
            <th>Item / SKU</th>
            <th class="num">Quantity</th>
            <th class="num">Unit Rate (₹)</th>
            <th class="num">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${sku}</strong></td>
            <td class="num">${formattedQty} units</td>
            <td class="num">₹${rate || '—'}</td>
            <td class="num">₹${formattedTotal}</td>
          </tr>
          <tr class="total-row">
            <td colspan="3">Total Order Value</td>
            <td class="num">₹${formattedTotal}</td>
          </tr>
        </tbody>
      </table>

      <div class="meta-grid">
        <div class="meta-col">
          <strong style="color: #5b6b62; display: block; font-size: 11px; text-transform: uppercase;">Payment & Credit Terms</strong>
          <span>${creditDays} Days Credit</span>
        </div>
        <div class="meta-col">
          <strong style="color: #5b6b62; display: block; font-size: 11px; text-transform: uppercase;">Expected Delivery Date</strong>
          <span>${delivery || 'As per SLA'}</span>
        </div>
      </div>

      ${
        notes
          ? `<div class="notes-box"><strong>Special Instructions:</strong><br>${notes}</div>`
          : ''
      }
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;">Green Fibre Supply Chain & Procurement Division</p>
      <p style="margin: 0;">This is an automated purchase order notification sent via GreenFibre ERP.</p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Sends a Purchase Order email to a single vendor
 */
export async function sendPurchaseOrderEmail({ to, vendorName, poDetails }) {
  if (!to) {
    throw new Error(`Recipient email is required to send PO for ${vendorName || 'Vendor'}`);
  }

  const transporter = await getTransporter();
  const poNumber = poDetails?.poNumber || `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const sender = process.env.SMTP_FROM || '"GreenFibre Procurement" <procurement@greenfibre.com>';

  const mailOptions = {
    from: sender,
    to,
    subject: `Purchase Order ${poNumber} - Green Fibre`,
    text: `Purchase Order ${poNumber}\nVendor: ${vendorName}\nSKU: ${poDetails?.sku}\nQty: ${poDetails?.qty}\nRate: ₹${poDetails?.rate}\nTotal: ₹${((Number(poDetails?.qty) || 0) * (Number(poDetails?.rate) || 0)).toLocaleString('en-IN')}`,
    html: renderPoEmailHtml({ vendorName, poDetails: { ...poDetails, poNumber } }),
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);

  console.log(`✉️ PO Email sent to ${to} (Message ID: ${info.messageId})`);
  if (previewUrl) {
    console.log(`🔗 Ethereal Email Preview URL: ${previewUrl}`);
  }

  return {
    success: true,
    messageId: info.messageId,
    previewUrl: previewUrl || null,
    recipient: to,
    vendorName,
  };
}
