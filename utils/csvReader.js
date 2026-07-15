require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs   = require('fs');
const path = require('path');

/**
 * Reads and parses a pipe-delimited markdown-style CSV file into an array of objects.
 * Supports ${ENV_VAR} placeholder substitution in cell values.
 * @param {string} filePath - Path to the CSV file
 * @returns {Array<Object>} Array of row objects keyed by header names
 */
function readCSV(filePath) {
  const absolutePath = path.resolve(filePath);
  const content = fs.readFileSync(absolutePath, 'utf-8');
  const lines = content.trim().split('\n').filter(l => l.trim() && !/^\|[-| ]+\|$/.test(l.trim()));

  // Support both comma-separated and pipe-delimited formats
  const delimiter = lines[0].includes('|') ? '|' : ',';
  const splitRow = (line) =>
    line.split(delimiter).map(v => v.trim()).filter((_, i, arr) =>
      delimiter === '|' ? i > 0 && i < arr.length - 1 : true
    );

  const headers = splitRow(lines[0]);

  return lines.slice(1).map(line => {
    const values = splitRow(line);
    const row = {};
    headers.forEach((header, index) => {
      const raw = values[index] || '';
      // Resolve ${ENV_VAR} placeholders from environment
      row[header] = raw.replace(/\$\{([^}]+)\}/g, (_, key) => process.env[key] || '');
    });
    return row;
  });
}

/**
 * Returns test data: reads from CSV if it exists, otherwise falls back to env vars.
 * This allows CI environments to run without committing the sensitive data.csv file.
 * @param {string} filePath - Path to the CSV file
 * @returns {Object} Test data row as an object
 */
function getTestData(filePath = 'data/data.csv') {
  const absolutePath = path.resolve(filePath);

  if (fs.existsSync(absolutePath)) {
    const rows = readCSV(filePath);
    if (rows.length) return rows[0];
  }

  // Fallback: build test data entirely from environment variables
  console.warn(`[csvReader] ${filePath} not found — loading test data from environment variables.`);
  return {
    url:        process.env.BASE_URL        || '',
    username:   process.env.APP_USERNAME    || '',
    password:   process.env.APP_PASSWORD    || '',
    company:    process.env.TEST_COMPANY    || '',
    address1:   process.env.TEST_ADDRESS1   || '',
    address2:   process.env.TEST_ADDRESS2   || '',
    city:       process.env.TEST_CITY       || '',
    state:      process.env.TEST_STATE      || '',
    zip:        process.env.TEST_ZIP        || '',
    country:    process.env.TEST_COUNTRY    || 'USA',
    cardNumber: process.env.TEST_CARD_NUMBER || '',
    expiry:     process.env.TEST_CARD_EXPIRY || '',
    cvv:        process.env.TEST_CARD_CVV   || '',
    email:      process.env.TEST_EMAIL      || '',
  };
}

module.exports = { readCSV, getTestData };