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
 * Generate an ultra-wide, spacious, premium HTML email template for GreenFibre Purchase Orders.
 * Features a 680px desktop width, full-bleed mobile layout, extra-wide metric cards, and zero wrapping.
 */
function renderPoEmailHtml({ vendorName, poDetails }) {
  const {
    poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    sku = 'GF-CAS-001',
    productName = '',
    qty = 0,
    rate = 0,
    creditDays = 30,
    delivery = 'Standard Lead Time',
    notes = '',
  } = poDetails || {};

  const totalValue = (Number(qty) || 0) * (Number(rate) || 0);
  const formattedTotal = totalValue.toLocaleString('en-IN');
  const formattedRate = Number(rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedQty = Number(qty || 0).toLocaleString('en-IN');
  const issueDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Purchase Order ${poNumber} - GreenFibre</title>
  <style>
    /* Reset & Base */
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-width: 100% !important;
      background-color: #edf2ee;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table {
      border-spacing: 0 !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      margin: 0 auto !important;
    }
    img {
      border: 0;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #edf2ee;
      padding: 36px 0;
    }
    .main-card {
      background-color: #ffffff;
      margin: 0 auto;
      max-width: 680px;
      width: 100%;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 12px 36px rgba(13, 56, 38, 0.08);
      border: 1px solid #d8e2dc;
    }

    /* Desktop vs Mobile display helpers */
    .mobile-only {
      display: none !important;
      max-height: 0px !important;
      overflow: hidden !important;
      mso-hide: all !important;
    }
    .desktop-only {
      display: table !important;
    }

    /* Mobile Responsive Wide Layout */
    @media only screen and (max-width: 640px) {
      .wrapper {
        padding: 0 !important;
      }
      .main-card {
        border-radius: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        border-left: 0 !important;
        border-right: 0 !important;
        border-top: 0 !important;
      }
      .content-padding {
        padding: 24px 20px !important;
      }
      .header-padding {
        padding: 26px 20px !important;
      }
      .desktop-only {
        display: none !important;
        max-height: 0px !important;
        overflow: hidden !important;
      }
      .mobile-only {
        display: table !important;
        max-height: none !important;
        overflow: visible !important;
        width: 100% !important;
      }
      .col-stack {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        margin-bottom: 14px !important;
      }
      .hide-mobile {
        display: none !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #edf2ee;">
  <center class="wrapper">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 0;">
          <!-- MAIN CONTAINER (680px WIDE) -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="main-card" style="max-width: 680px; background-color: #ffffff; border-radius: 20px; border: 1px solid #d8e2dc;">
            
            <!-- HEADER WITH LUXURY EMERALD GRADIENT -->
            <tr>
              <td style="background: linear-gradient(135deg, #092c1e 0%, #135235 100%); padding: 34px 40px;" class="header-padding">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td>
                      <!-- Brand Logo / Wordmark -->
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #e5c07b; width: 34px; height: 34px; border-radius: 9px; text-align: center; vertical-align: middle;">
                            <span style="color: #092c1e; font-weight: 900; font-size: 20px; font-family: sans-serif; line-height: 34px;">G</span>
                          </td>
                          <td style="padding-left: 14px;">
                            <span style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 0.6px; font-family: sans-serif;">GREEN FIBRE</span>
                          </td>
                        </tr>
                      </table>
                      <div style="color: #bfe5d1; font-size: 13px; font-weight: 500; margin-top: 6px; letter-spacing: 0.4px;">
                        SUPPLY CHAIN & PROCUREMENT DIVISION
                      </div>
                    </td>
                    <td align="right" style="vertical-align: middle;">
                      <div style="background-color: rgba(255, 255, 255, 0.16); border: 1px solid rgba(255, 255, 255, 0.32); color: #ffffff; padding: 6px 14px; border-radius: 24px; font-size: 11px; font-weight: 700; display: inline-block; letter-spacing: 0.6px; text-transform: uppercase;">
                        Purchase Order
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- PO SUMMARY BANNER (PO # & DATE) -->
            <tr>
              <td style="background-color: #f6faf7; border-bottom: 1px solid #d8e2dc; padding: 18px 40px;" class="content-padding">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td>
                      <span style="font-size: 11px; color: #576d61; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">PO Reference</span>
                      <div style="font-size: 17px; color: #092c1e; font-family: monospace, sans-serif; font-weight: 800; margin-top: 2px;">${poNumber}</div>
                    </td>
                    <td align="right">
                      <span style="font-size: 11px; color: #576d61; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Issue Date</span>
                      <div style="font-size: 15px; color: #16231d; font-weight: 600; margin-top: 2px;">${issueDate}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CONTENT BODY (EXTRA SPACIOUS) -->
            <tr>
              <td style="padding: 34px 40px;" class="content-padding">
                
                <!-- GREETING -->
                <p style="margin: 0 0 10px 0; font-size: 16px; color: #16231d; line-height: 1.4;">
                  Dear <strong>${vendorName || 'Valued Vendor Partner'}</strong>,
                </p>
                <p style="margin: 0 0 26px 0; font-size: 14px; color: #44584e; line-height: 1.65;">
                  We are pleased to place the following official purchase order. Please review the item specifications, delivery schedule, and commercial terms outlined below:
                </p>

                <!-- ══════════════════════════════════════════════════
                     DESKTOP VIEW: WIDE 4-COLUMN SPECIFICATION TABLE
                ══════════════════════════════════════════════════ -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="desktop-only" style="width: 100%; border: 1px solid #d4e0d9; border-radius: 14px; overflow: hidden; margin-bottom: 28px;">
                  <thead>
                    <tr style="background-color: #eef5f0; border-bottom: 1px solid #d4e0d9;">
                      <th style="padding: 16px 20px; font-size: 11px; font-weight: 700; color: #3e5a4b; text-transform: uppercase; letter-spacing: 0.6px; text-align: left; width: 40%;">Item / SKU</th>
                      <th style="padding: 16px 16px; font-size: 11px; font-weight: 700; color: #3e5a4b; text-transform: uppercase; letter-spacing: 0.6px; text-align: right; width: 20%;">Quantity</th>
                      <th style="padding: 16px 16px; font-size: 11px; font-weight: 700; color: #3e5a4b; text-transform: uppercase; letter-spacing: 0.6px; text-align: right; width: 20%;">Unit Rate</th>
                      <th style="padding: 16px 20px; font-size: 11px; font-weight: 700; color: #3e5a4b; text-transform: uppercase; letter-spacing: 0.6px; text-align: right; width: 20%;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="background-color: #ffffff; border-bottom: 1px solid #e7eee9;">
                      <td style="padding: 18px 20px; vertical-align: middle;">
                        <strong style="color: #092c1e; font-family: monospace, sans-serif; font-size: 15px;">${sku}</strong>
                        <div style="font-size: 13px; color: #3e5a4b; margin-top: 4px; font-weight: 600;">${productName || 'Standard Finished Goods'}</div>
                      </td>
                      <td style="padding: 18px 16px; text-align: right; vertical-align: middle; font-family: monospace, sans-serif; font-size: 15px; font-weight: 700; color: #16231d;">
                        ${formattedQty} units
                      </td>
                      <td style="padding: 18px 16px; text-align: right; vertical-align: middle; font-family: monospace, sans-serif; font-size: 15px; color: #16231d;">
                        ₹${formattedRate}
                      </td>
                      <td style="padding: 18px 20px; text-align: right; vertical-align: middle; font-family: monospace, sans-serif; font-size: 16px; font-weight: 800; color: #092c1e;">
                        ₹${formattedTotal}
                      </td>
                    </tr>

                    <!-- TOTAL ROW -->
                    <tr style="background-color: #f5f9f6;">
                      <td colspan="2" style="padding: 18px 20px; font-size: 14px; font-weight: 700; color: #092c1e;">
                        Total Order Value:
                      </td>
                      <td colspan="2" style="padding: 18px 20px; text-align: right; font-size: 22px; font-weight: 900; color: #092c1e; font-family: monospace, sans-serif;">
                        ₹${formattedTotal}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- ══════════════════════════════════════════════════
                     MOBILE VIEW: FULL-WIDTH EXTRA WIDE SPACIOUS CARDS
                     (Numbers will NEVER wrap and have maximum space!)
                ══════════════════════════════════════════════════ -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="mobile-only" style="margin-bottom: 26px; border: 1px solid #d4e0d9; border-radius: 14px; overflow: hidden; background-color: #ffffff; width: 100%;">
                  <!-- ITEM HEADER -->
                  <tr>
                    <td style="background-color: #eef5f0; padding: 16px 20px; border-bottom: 1px solid #d4e0d9;">
                      <span style="font-size: 10px; font-weight: 700; color: #576d61; text-transform: uppercase; letter-spacing: 0.6px; display: block; margin-bottom: 2px;">Ordered Item</span>
                      <strong style="color: #092c1e; font-family: monospace, sans-serif; font-size: 17px;">${sku}</strong>
                      ${productName ? `<div style="font-size: 13px; color: #3e5a4b; font-weight: 600; margin-top: 3px;">${productName}</div>` : ''}
                    </td>
                  </tr>

                  <!-- QUANTITY & RATE (WIDE 2-BOX GRID) -->
                  <tr>
                    <td style="padding: 18px 16px; border-bottom: 1px solid #eef3f0;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <!-- Quantity Box -->
                          <td width="48%" style="background-color: #f7faf8; border: 1px solid #dfe9e3; border-radius: 12px; padding: 14px 16px; vertical-align: top;">
                            <span style="display: block; font-size: 10px; font-weight: 700; color: #6b7f74; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Order Quantity</span>
                            <span style="font-size: 16px; font-weight: 900; color: #16231d; font-family: monospace, sans-serif;">${formattedQty} <span style="font-size: 12px; font-weight: normal; color: #6b7f74;">units</span></span>
                          </td>
                          <td width="4%">&nbsp;</td>
                          <!-- Rate Box -->
                          <td width="48%" style="background-color: #f7faf8; border: 1px solid #dfe9e3; border-radius: 12px; padding: 14px 16px; vertical-align: top;">
                            <span style="display: block; font-size: 10px; font-weight: 700; color: #6b7f74; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Unit Rate</span>
                            <span style="font-size: 16px; font-weight: 900; color: #092c1e; font-family: monospace, sans-serif;">₹${formattedRate}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- TOTAL ORDER VALUE (EXTRA WIDE PROMINENT BOX) -->
                  <tr>
                    <td style="background-color: #f3f8f5; padding: 18px 20px; text-align: center;">
                      <span style="display: block; font-size: 11px; font-weight: 700; color: #3e5a4b; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 4px;">Total Order Value</span>
                      <div style="font-size: 24px; font-weight: 900; color: #092c1e; font-family: monospace, sans-serif;">
                        ₹${formattedTotal}
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- ══════════════════════════════════════════════════
                     COMMERCIAL TERMS & TIMELINE (WIDE FULL-WIDTH BOXES)
                ══════════════════════════════════════════════════ -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 26px;">
                  <tr>
                    <td width="48%" class="col-stack" style="background-color: #f8faf8; border: 1px solid #dbe6e0; border-radius: 14px; padding: 18px 20px; vertical-align: top;">
                      <span style="display: block; font-size: 11px; font-weight: 700; color: #576d61; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                        Payment & Credit Terms
                      </span>
                      <strong style="font-size: 15px; color: #092c1e; font-family: sans-serif; display: block;">
                        ${creditDays} Days Credit
                      </strong>
                    </td>
                    <td width="4%" class="hide-mobile">&nbsp;</td>
                    <td width="48%" class="col-stack" style="background-color: #f8faf8; border: 1px solid #dbe6e0; border-radius: 14px; padding: 18px 20px; vertical-align: top;">
                      <span style="display: block; font-size: 11px; font-weight: 700; color: #576d61; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                        Expected Delivery Date
                      </span>
                      <strong style="font-size: 15px; color: #092c1e; font-family: sans-serif; display: block;">
                        ${delivery || 'Standard Delivery Lead Time'}
                      </strong>
                    </td>
                  </tr>
                </table>

                <!-- SPECIAL INSTRUCTIONS (WIDE BOX) -->
                ${
                  notes
                    ? `
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                  <tr>
                    <td style="background-color: #fffbf0; border-left: 5px solid #d4a037; border-top: 1px solid #f2e0b5; border-right: 1px solid #f2e0b5; border-bottom: 1px solid #f2e0b5; border-radius: 12px; padding: 18px 22px;">
                      <span style="display: block; font-size: 11px; font-weight: 700; color: #7a5813; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px;">
                        Special Instructions & Quality Specifications
                      </span>
                      <p style="margin: 0; font-size: 13px; color: #4f3a10; line-height: 1.65;">
                        ${notes}
                      </p>
                    </td>
                  </tr>
                </table>
                `
                    : ''
                }

                <!-- CONFIRMATION / ACKNOWLEDGE BUTTON -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 14px; margin-bottom: 8px;">
                  <tr>
                    <td align="center">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="background-color: #092c1e; border-radius: 12px; padding: 16px 32px; box-shadow: 0 4px 14px rgba(9, 44, 30, 0.22);">
                            <a href="mailto:procurement@greenfibre.com?subject=Acknowledge%20PO%20${poNumber}%20-%20${vendorName || ''}&body=Dear%20GreenFibre%20Procurement%20Team%2C%0A%0AWe%20hereby%20acknowledge%20and%20accept%20Purchase%20Order%20${poNumber}.%20Our%20planned%20dispatch%20date%20is%3A%20${delivery || ''}.%0A%0ARegards%2C%0A${vendorName || 'Vendor'}"
                               target="_blank"
                               style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; display: inline-block; font-family: sans-serif; letter-spacing: 0.3px;">
                              ✓ Reply & Acknowledge Order
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background-color: #f6faf7; border-top: 1px solid #d8e2dc; padding: 26px 40px; text-align: center;" class="content-padding">
                <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #092c1e; letter-spacing: 0.6px; text-transform: uppercase;">
                  Green Fibre Private Limited · Supply Chain Operations
                </p>
                <p style="margin: 0; font-size: 11px; color: #7a8f83; line-height: 1.55;">
                  This is an official system purchase order generated by GreenFibre ERP. Please retain for your accounting & dispatch documentation.
                </p>
              </td>
            </tr>

          </table>
          <!-- END MAIN CONTAINER -->
        </td>
      </tr>
    </table>
  </center>
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
    text: `Purchase Order ${poNumber}\nVendor: ${vendorName}\nItem: ${poDetails?.productName ? `${poDetails.productName} (${poDetails.sku})` : (poDetails?.sku || 'GF-CAS-001')}\nQty: ${poDetails?.qty}\nRate: ₹${poDetails?.rate}\nTotal: ₹${((Number(poDetails?.qty) || 0) * (Number(poDetails?.rate) || 0)).toLocaleString('en-IN')}`,
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

/**
 * Sends a Day-10 / Production Status Follow-up Reminder email to the vendor (Extra Spacious)
 */
export async function sendVendorFollowUpReminderEmail({ to, vendorName, poDetails, daysElapsed = 10, givenDays = 15 }) {
  if (!to) {
    throw new Error(`Recipient email is required for vendor reminder (${vendorName || 'Vendor'})`);
  }

  const transporter = await getTransporter();
  const {
    poNumber = 'PO-2026-XXXX',
    sku = 'GF-CAS-001',
    quantity = 0,
    expectedDelivery = 'As scheduled',
  } = poDetails || {};

  const sender = process.env.SMTP_FROM || '"GreenFibre Procurement" <procurement@greenfibre.com>';
  const subject = `Urgent Status Update Required: Order ${poNumber} (${sku}) - Day ${daysElapsed} of ${givenDays}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Status Update - ${poNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #edf2ee; margin: 0; padding: 24px 0; color: #16231d; }
    .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #d8e2dc; overflow: hidden; box-shadow: 0 8px 28px rgba(0,0,0,0.07); }
    .header { background: linear-gradient(135deg, #b9791e 0%, #d49533 100%); color: #ffffff; padding: 30px 36px; }
    .content { padding: 32px 36px; }
    .alert-box { background: #fbf1df; border-left: 5px solid #b9791e; padding: 18px 22px; border-radius: 12px; font-size: 14px; color: #5f3e0f; margin-bottom: 26px; line-height: 1.6; }
    .footer { padding: 22px 36px; background: #f6faf7; border-top: 1px solid #d8e2dc; font-size: 11px; color: #7a8f83; text-align: center; }
    @media only screen and (max-width: 640px) {
      body { padding: 0 !important; }
      .container { border-radius: 0 !important; border-left: 0 !important; border-right: 0 !important; border-top: 0 !important; }
      .header, .content, .footer { padding: 24px 20px !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 21px; font-weight: 800; letter-spacing: 0.3px;">GreenFibre Procurement Check</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">SLA Delivery Milestone: Day ${daysElapsed} of ${givenDays} Days</p>
    </div>

    <div class="content">
      <p style="margin-top: 0; font-size: 16px;">Dear <strong>${vendorName || 'Valued Vendor'}</strong>,</p>

      <div class="alert-box">
        <strong>Status Update Notice:</strong> It has been <strong>${daysElapsed} days</strong> since Purchase Order <strong>${poNumber}</strong> was issued (allocated timeline: ${givenDays} days).
      </div>

      <p style="font-size: 14px; color: #334139; line-height: 1.65; margin-bottom: 22px;">
        Please confirm current production readiness and dispatch schedule to ensure on-time delivery by the promised deadline.
      </p>

      <!-- Wide Box Grid for Item & Qty -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #d8e2dc; border-radius: 14px; overflow: hidden; margin-bottom: 26px;">
        <tr>
          <td style="background-color: #f7faf8; padding: 14px 20px; border-bottom: 1px solid #d8e2dc;">
            <span style="font-size: 10px; font-weight: 700; color: #6b7f74; text-transform: uppercase; letter-spacing: 0.5px;">PO Reference</span>
            <div style="font-size: 16px; font-weight: 800; color: #092c1e; font-family: monospace;">${poNumber} · ${sku}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 18px 20px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="48%" style="background-color: #f8faf8; border: 1px solid #dfe9e3; border-radius: 12px; padding: 14px 18px;">
                  <span style="font-size: 10px; font-weight: 700; color: #6b7f74; text-transform: uppercase; display: block; margin-bottom: 6px;">Quantity</span>
                  <strong style="font-size: 16px; color: #16231d; font-family: monospace;">${Number(quantity).toLocaleString('en-IN')} units</strong>
                </td>
                <td width="4%">&nbsp;</td>
                <td width="48%" style="background-color: #f8faf8; border: 1px solid #dfe9e3; border-radius: 12px; padding: 14px 18px;">
                  <span style="font-size: 10px; font-weight: 700; color: #6b7f74; text-transform: uppercase; display: block; margin-bottom: 6px;">Promised Delivery</span>
                  <strong style="font-size: 15px; color: #b9791e; font-family: monospace;">${expectedDelivery || 'As agreed'}</strong>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #576d61; line-height: 1.6; margin: 0;">
        Kindly reply to this email with your tracking ID or estimated dispatch date.
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0;">Green Fibre Supply Chain Operations · Automated SLA Follow-up System</p>
    </div>
  </div>
</body>
</html>
`;

  const info = await transporter.sendMail({
    from: sender,
    to,
    subject,
    text: `Status Update Request for PO ${poNumber} (${sku}). Day ${daysElapsed} of ${givenDays} reached. Expected Delivery: ${expectedDelivery}. Please reply with current progress.`,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`✉️ Follow-up reminder email sent to ${to} (Message ID: ${info.messageId})`);

  return {
    success: true,
    messageId: info.messageId,
    previewUrl: previewUrl || null,
    recipient: to,
    vendorName,
  };
}

/**
 * Sends a price-change approval request to the admin, with one-click
 * Approve / Reject links.
 */
export async function sendPriceChangeApprovalEmail({ to, priceChange, approveUrl, rejectUrl }) {
  if (!to) throw new Error('Recipient email is required for price change approval');

  const transporter = await getTransporter();
  const { id, sku, productName, channel, fromPrice, toPrice, marginAfterPct, requestedBy } = priceChange;
  const pctChange = (((toPrice - fromPrice) / fromPrice) * 100).toFixed(1);
  const sender = process.env.SMTP_FROM || '"GreenFibre Pricing" <pricing@greenfibre.com>';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:24px 0;background:#edf2ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#16231d;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #d8e2dc;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#092c1e 0%,#135235 100%);padding:26px 32px;">
      <span style="color:#fff;font-size:19px;font-weight:800;">GREEN FIBRE — Price Change Approval</span>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 18px 0;font-size:15px;">A price change is waiting for your decision:</p>
      <div style="background:#f7faf8;border:1px solid #dfe9e3;border-radius:12px;padding:18px 20px;margin-bottom:22px;">
        <div style="font-family:monospace;font-size:13px;color:#576d61;margin-bottom:4px;">PC-${id} · ${sku} · ${channel}</div>
        <div style="font-size:15px;font-weight:700;margin-bottom:8px;">${productName || ''}</div>
        <div style="font-size:16px;">₹${fromPrice} → <strong>₹${toPrice}</strong> (${pctChange}%)</div>
        <div style="font-size:13px;color:#576d61;margin-top:6px;">Margin after: ${marginAfterPct ?? '—'}% · Requested by: ${requestedBy}</div>
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:12px;">
          <a href="${approveUrl}" style="background:#092c1e;color:#fff;text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">✓ Approve & Publish</a>
        </td>
        <td>
          <a href="${rejectUrl}" style="background:#fff;color:#b3261e;border:1px solid #e0b4b0;text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">✕ Reject</a>
        </td>
      </tr></table>
      <p style="font-size:12px;color:#7a8f83;margin-top:22px;">This link is valid for 7 days and can only be used once.</p>
    </div>
  </div>
</body>
</html>`;

  const info = await transporter.sendMail({
    from: sender,
    to,
    subject: `Price Change Approval Needed: ${sku} on ${channel} (₹${fromPrice} → ₹${toPrice})`,
    text: `Price change for ${sku} on ${channel}: ₹${fromPrice} -> ₹${toPrice}. Approve: ${approveUrl}  Reject: ${rejectUrl}`,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`✉️ Price change approval email sent to ${to} (Message ID: ${info.messageId})`);
  if (previewUrl) console.log(`🔗 Ethereal Preview: ${previewUrl}`);

  return { success: true, messageId: info.messageId, previewUrl: previewUrl || null };
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const transporter = await getTransporter();
  const sender = process.env.SMTP_FROM || '"GreenFibre" <no-reply@greenfibre.com>';

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px 0;background:#edf2ee;font-family:-apple-system,sans-serif;color:#16231d;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #d8e2dc;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#092c1e 0%,#135235 100%);padding:26px 32px;">
      <span style="color:#fff;font-size:19px;font-weight:800;">GREEN FIBRE</span>
    </div>
    <div style="padding:28px 32px;">
      <p style="font-size:15px;margin:0 0 18px 0;">Hi ${name || ''}, click below to set a new password. This link expires in 1 hour and can only be used once.</p>
      <a href="${resetUrl}" style="background:#092c1e;color:#fff;text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">Reset Password</a>
      <p style="font-size:12px;color:#7a8f83;margin-top:22px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  </div>
</body></html>`;

  const info = await transporter.sendMail({
    from: sender,
    to,
    subject: 'Reset your Green Fibre password',
    text: `Reset your password: ${resetUrl}`,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`✉️ Password reset email sent to ${to}`);
  if (previewUrl) console.log(`🔗 Ethereal Preview: ${previewUrl}`);
  return { success: true, previewUrl: previewUrl || null };
}

export async function sendPushRecommendationEmail({ to, recommendations, baseUrl = 'http://localhost:3001' }) {
  const transporter = await getTransporter();
  const sender = process.env.SMTP_FROM || '"GreenFibre Procurement" <no-reply@greenfibre.com>';
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  let cleanBaseUrl = (baseUrl || process.env.APP_BASE_URL || 'http://localhost:3001').trim();
  if (!cleanBaseUrl.startsWith('http://') && !cleanBaseUrl.startsWith('https://')) {
    cleanBaseUrl = `http://${cleanBaseUrl}`;
  }
  cleanBaseUrl = cleanBaseUrl.replace(/\/+$/, '');

  const dashboardUrl = process.env.APP_FRONTEND_URL || 'http://localhost:5173';

  function getChannelBadge(channel) {
    const ch = String(channel || '').toLowerCase();
    if (ch === 'amazon') {
      return `<span style="display:inline-block;background:#fff8ee;color:#b45309;font-size:11px;font-weight:800;letter-spacing:0.4px;text-transform:uppercase;padding:5px 12px;border-radius:20px;border:1px solid #fde68a;">Target: Amazon</span>`;
    }
    if (ch === 'flipkart') {
      return `<span style="display:inline-block;background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:800;letter-spacing:0.4px;text-transform:uppercase;padding:5px 12px;border-radius:20px;border:1px solid #bfdbfe;">Target: Flipkart</span>`;
    }
    return `<span style="display:inline-block;background:#ecfdf5;color:#047857;font-size:11px;font-weight:800;letter-spacing:0.4px;text-transform:uppercase;padding:5px 12px;border-radius:20px;border:1px solid #a7f3d0;">Target: Direct Store</span>`;
  }

  const cardsHtml = recommendations.map((r) => {
    let tags = [];
    if (Array.isArray(r.reasonTags)) {
      tags = r.reasonTags;
    } else if (typeof r.reasonTags === 'string') {
      try {
        tags = JSON.parse(r.reasonTags);
      } catch {
        tags = [r.reasonTags];
      }
    }
    if (!Array.isArray(tags)) tags = [];

    const token = String(r.approvalToken || r.approval_token || '').trim();
    const approveUrl = `${cleanBaseUrl}/api/push-recommendations/${r.id}/decide?token=${encodeURIComponent(token)}&action=approve`;
    const dismissUrl = `${cleanBaseUrl}/api/push-recommendations/${r.id}/decide?token=${encodeURIComponent(token)}&action=dismiss`;

    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#ffffff;border:1px solid #dce5df;border-radius:14px;overflow:hidden;box-shadow:0 4px 14px rgba(18,56,36,0.04);">
      <!-- Card Header -->
      <tr>
        <td style="padding:16px 22px;background:#f7faf8;border-bottom:1px solid #e6ede8;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;">
                <span style="display:inline-block;font-family:'SFMono-Regular',Consolas,Menlo,monospace;font-size:12px;font-weight:700;color:#1e3a2c;background:#e8f0eb;padding:4px 9px;border-radius:6px;border:1px solid #cfded4;">
                  ${r.sku}
                </span>
                ${r.category ? `
                <span style="display:inline-block;font-size:11.5px;font-weight:600;color:#576d61;margin-left:8px;">
                  • ${r.category}
                </span>` : ''}
              </td>
              <td style="text-align:right;vertical-align:middle;">
                ${getChannelBadge(r.recommendedChannel)}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Card Body -->
      <tr>
        <td style="padding:22px;">
          <div style="font-size:17px;font-weight:800;color:#111827;margin-bottom:14px;line-height:1.3;">
            ${r.productName || r.sku}
          </div>

          <!-- Key Metrics Grid -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;background:#f9fbf9;border:1px solid #e6eee8;border-radius:10px;overflow:hidden;">
            <tr>
              <td style="padding:12px 14px;border-right:1px solid #e6eee8;width:33%;">
                <div style="font-size:10.5px;font-weight:700;color:#6b7f73;text-transform:uppercase;letter-spacing:0.5px;">Sell-Through (30d)</div>
                <div style="font-size:15px;font-weight:800;color:#16231d;margin-top:3px;">${r.sellThroughPct != null ? `${r.sellThroughPct}%` : '—'}</div>
              </td>
              <td style="padding:12px 14px;border-right:1px solid #e6eee8;width:33%;">
                <div style="font-size:10.5px;font-weight:700;color:#6b7f73;text-transform:uppercase;letter-spacing:0.5px;">Stock Cover</div>
                <div style="font-size:15px;font-weight:800;color:#16231d;margin-top:3px;">${r.daysCover != null ? `${r.daysCover} days` : '—'}</div>
              </td>
              <td style="padding:12px 14px;width:34%;">
                <div style="font-size:10.5px;font-weight:700;color:#6b7f73;text-transform:uppercase;letter-spacing:0.5px;">Margin %</div>
                <div style="font-size:15px;font-weight:800;color:#16231d;margin-top:3px;">${r.marginPct != null ? `${r.marginPct}%` : '—'}</div>
              </td>
            </tr>
          </table>

          <!-- Reason Bullets -->
          <div style="margin-bottom:14px;">
            <div style="font-size:11px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
              Trigger Analysis
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${tags.map(t => `
                <tr>
                  <td style="width:20px;vertical-align:top;padding:3px 0;color:#135235;font-weight:bold;font-size:13px;">✦</td>
                  <td style="padding:3px 0;font-size:13px;color:#374151;line-height:1.45;">${t}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <!-- Suggested Action Callout -->
          <div style="padding:12px 16px;background:#f0f6f2;border-left:4px solid #135235;border-radius:0 8px 8px 0;font-size:12.5px;color:#2c4436;line-height:1.5;margin-bottom:20px;">
            <strong style="color:#0e3d27;">Recommended Action:</strong> ${r.suggestedAction}
          </div>

          <!-- Action Buttons -->
          ${token ? `
          <div style="padding-top:14px;border-top:1px solid #edf2ee;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:8px;background:#135235;">
                  <a href="${approveUrl}" target="_blank" style="display:inline-block;padding:10px 22px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
                    ✓ Approve &amp; Push to ${String(r.recommendedChannel || 'channel').toUpperCase()}
                  </a>
                </td>
                <td style="width:12px;"></td>
                <td style="border-radius:8px;border:1px solid #d1d5db;background:#ffffff;">
                  <a href="${dismissUrl}" target="_blank" style="display:inline-block;padding:9px 18px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:600;color:#4b5563;text-decoration:none;border-radius:8px;">
                    ✕ Dismiss
                  </a>
                </td>
              </tr>
            </table>
          </div>
          ` : ''}
        </td>
      </tr>
    </table>`;
  }).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sales Push Recommendations</title>
</head>
<body style="margin:0;padding:28px 12px;background:#ebf0ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#16231d;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:18px;border:1px solid #d4dfd7;overflow:hidden;box-shadow:0 12px 36px rgba(0,0,0,0.06);">
    
    <!-- Premium Header -->
    <div style="background:linear-gradient(135deg,#071f15 0%,#0d3824 50%,#155d3b 100%);padding:30px 32px;color:#ffffff;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#85cca7;margin-bottom:6px;">
              GREEN FIBRE · PROCUREMENT &amp; SALES DISPATCH
            </div>
            <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.2;">
              Sales Push Recommendations
            </h1>
            <div style="font-size:13px;color:#c9ddd0;margin-top:6px;">
              ${today} · <strong style="color:#ffffff;">${recommendations.length} item(s)</strong> flagged for 1-click admin approval
            </div>
          </td>
          <td style="text-align:right;vertical-align:top;">
            <div style="display:inline-block;background:rgba(255,255,255,0.12);padding:6px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.18);font-size:12px;font-weight:700;color:#ffffff;">
              Action Required
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Intro Text -->
    <div style="padding:22px 26px 8px 26px;">
      <p style="margin:0 0 16px 0;font-size:13.5px;color:#4a5c52;line-height:1.55;">
        Our automated inventory-velocity scan identified the following products with low sell-through, elevated stock cover, or underexposed channel listings. 
        Please review the computed metrics below and approve or dismiss each recommendation with a single click.
      </p>
    </div>

    <!-- Cards Container -->
    <div style="padding:0 26px 12px 26px;">
      ${cardsHtml}
    </div>

    <!-- Footer -->
    <div style="padding:20px 26px 26px 26px;background:#f7faf8;border-top:1px solid #e5ede7;text-align:center;">
      <p style="margin:0 0 8px 0;font-size:12.5px;color:#6b7f73;">
        Approvals are processed immediately and synced directly with your live dashboard.
      </p>
      <a href="${dashboardUrl}/forecasting" target="_blank" style="display:inline-block;font-size:12.5px;font-weight:700;color:#135235;text-decoration:underline;">
        Open GreenFibre Demand Forecasting Dashboard →
      </a>
      <div style="margin-top:12px;font-size:11px;color:#94a398;">
        Sent to ${to} · GreenFibre Automated Inventory Intelligence
      </div>
    </div>

  </div>
</body>
</html>`;

  const textLines = recommendations.map(r => {
    let tags = [];
    if (Array.isArray(r.reasonTags)) tags = r.reasonTags;
    else if (typeof r.reasonTags === 'string') {
      try { tags = JSON.parse(r.reasonTags); } catch { tags = [r.reasonTags]; }
    }
    const token = String(r.approvalToken || r.approval_token || '').trim();
    const approveUrl = `${cleanBaseUrl}/api/push-recommendations/${r.id}/decide?token=${encodeURIComponent(token)}&action=approve`;
    const dismissUrl = `${cleanBaseUrl}/api/push-recommendations/${r.id}/decide?token=${encodeURIComponent(token)}&action=dismiss`;
    return `SKU: ${r.sku}\nProduct: ${r.productName || r.sku}\nPush Target: ${r.recommendedChannel}\nReasons: ${(tags || []).join('; ')}\nSuggested Action: ${r.suggestedAction}\nApprove: ${approveUrl}\nDismiss: ${dismissUrl}`;
  }).join('\n\n' + '='.repeat(40) + '\n\n');

  const info = await transporter.sendMail({
    from: sender,
    to,
    subject: `⚡ Sales Push Action Required: ${recommendations.length} Product(s) Flagged (${today})`,
    text: textLines,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`✉️ Push recommendation email dispatched to ${to}`);
  if (previewUrl) console.log(`🔗 Ethereal Preview: ${previewUrl}`);
  return { success: true, previewUrl: previewUrl || null };
}



