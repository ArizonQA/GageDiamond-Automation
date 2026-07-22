'use strict';
const { URLS, TIMEOUTS } = require('../config/constants');

/**
 * CartPage Page Object
 * URL: https://devbox.gagediamonds.com/cart/
 */
class CartPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Proceed-to-checkout button — data-cart-checkout="true"
    this.checkoutBtn = page.locator('[data-cart-checkout="true"]');
  }

  /** Navigate to the cart page and wait for items to load. */
  async goto() {
    await this.page.goto(URLS.cart);
    await this.page.waitForLoadState('domcontentloaded');
    try {
      await this.page.waitForSelector(
        '[data-cart-item], .cart-item, article, [class*="cart"] li, [class*="CartItem"]',
        { state: 'visible', timeout: TIMEOUTS.domReady }
      );
    } catch {
      // Cart items may use different selectors — proceed anyway
    }
  }

  /**
   * Return up to 5 price strings visible in the cart (e.g. ["$852.50"]).
   * @returns {Promise<string[]>}
   */
  async getCartPrices() {
    return this.page.evaluate(() =>
      Array.from(document.querySelectorAll('*'))
        .filter(el => el.children.length === 0 && /^\$[\d,]+(\.\d{2})?$/.test(el.textContent.trim()))
        .map(el => el.textContent.trim())
        .slice(0, 5)
    );
  }

  /**
   * Click the Proceed to Checkout button and wait for navigation to the checkout domain.
   */
  async proceedToCheckout() {
    await this.checkoutBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.long });
    // Wait for any cart overlays/loaders to settle before clicking
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUTS.long });
    // JS click avoids overlay issues on the cart page
    await this.checkoutBtn.evaluate(btn => btn.click());
    // Wait for navigation away from cart — checkout may be on a different domain
    await this.page.waitForURL('**/checkout**', { timeout: 45000 });
  }
}

module.exports = { CartPage };