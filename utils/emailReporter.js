require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * Sends the HTML test report via email.
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.reportPath - Path to the HTML report file
 * @param {Object} options.summary - Test summary { passed, failed, total }
 */
const TEST_SCENARIOS = [
  { sno: 1, module: 'Login', scenario: 'Login and interact with Dashboard', priority: 'High' },
  { sno: 2, module: 'Product', scenario: 'Select Product Category and a Product', priority: 'High' },
  { sno: 3, module: 'Product List Page', scenario: 'List down all the Product, select a Product', priority: 'High' },
  { sno: 4, module: 'Product Description Page', scenario: 'Capture Product metrics and add to cart', priority: 'High' },
  { sno: 5, module: 'Cart Page', scenario: 'Verify Product added in cart', priority: 'High' },
  { sno: 6, module: 'Checkout Page', scenario: 'Able to Checkout the selected Product', priority: 'High' },
  { sno: 7, module: 'Order', scenario: 'Verify able to Place Order with Mandatory fields', priority: 'High' },
  { sno: 8, module: 'Order Confirmation', scenario: 'Order Placed Successfully', priority: 'High' },
];

async function sendReportEmail({ to, reportPath, summary, results = {} }) {
  // SMTP configuration — defaults to Office365 for Arizon Digital
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false,
    },
  });

  let attachments = [];
  if (reportPath && fs.existsSync(reportPath)) {
    attachments.push({
      filename: 'test-report.html',
      path: reportPath,
    });
  }

  const ENV_URL = process.env.ENV_URL || process.env.BASE_URL || 'https://devbox.gagediamonds.com/';

  const scenarioRows = TEST_SCENARIOS.map(({ sno, module, scenario, priority }) => {
    const result = results[sno];
    const resultCell = result === 'Pass'
      ? `<td style="color:green;font-weight:bold;text-align:center;">✅ Pass</td>`
      : result === 'Fail'
        ? `<td style="color:red;font-weight:bold;text-align:center;">❌ Fail</td>`
        : `<td style="color:gray;text-align:center;">—</td>`;
    return `
      <tr>
        <td style="text-align:center;">${sno}</td>
        <td>${module}</td>
        <td>${scenario}</td>
        <td><a href="${ENV_URL}">${ENV_URL}</a></td>
        <td style="text-align:center;">${priority}</td>
        ${resultCell}
      </tr>`;
  }).join('');

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:900px;margin:auto;">
      <h2 style="color:#2c3e50;">Test Report - Gage Diamond Happy Flow</h2>
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Summary:</strong>
        Total: <strong>${summary.total}</strong> &nbsp;|&nbsp;
        <span style="color:green;">Passed: <strong>${summary.passed}</strong></span> &nbsp;|&nbsp;
        <span style="color:red;">Failed: <strong>${summary.failed}</strong></span>
      </p>
      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:14px;">
        <thead style="background-color:#2c3e50;color:#ffffff;">
          <tr>
            <th>S.No</th>
            <th>Module</th>
            <th>Scenario</th>
            <th>Environment</th>
            <th>Priority</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          ${scenarioRows}
        </tbody>
      </table>
      <p style="margin-top:16px;color:#555;">Please find the detailed HTML report attached.</p>
    </div>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL,
    to: to || process.env.TEST_EMAIL,
    subject: `Test Report - Gage Diamond Happy Flow`,
    html: htmlBody,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.warn(`Email sending failed (configure SMTP_HOST/SMTP_USER/SMTP_PASS env vars): ${err.message}`);
  }
}

module.exports = { sendReportEmail };