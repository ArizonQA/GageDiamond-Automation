/**
 * Project-wide constants: URLs, timeouts, paths, and selectors config.
 * All sensitive values are read from environment variables (.env).
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const BASE_URL   = process.env.BASE_URL   || 'https://devbox.gagediamonds.com';
const SECURE_URL = process.env.SECURE_URL || 'https://securedev.gagediamonds.com';

const URLS = {
  home: '/',
  login: '/login/',
  register: '/register/',
  createAccount: '/create-account/',
  cart: '/cart/',
  studs: '/jewelry/earrings/studs/',
  rings: '/jewelry/rings/',
  fineJewelryRings: '/jewelry/rings/fine-jewelry/',
  checkout: `${SECURE_URL}/checkout`,
};

const TIMEOUTS = {
  short: 3000,
  medium: 8000,
  long: 15000,
  navigation: 20000,
  domReady: 10000,
};

const SCREENSHOTS_DIR = 'screenshots';

module.exports = { BASE_URL, SECURE_URL, URLS, TIMEOUTS, SCREENSHOTS_DIR };