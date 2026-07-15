'use strict';
const { TIMEOUTS } = require('../config/constants');

/**
 * ProductPage Page Object
 * Handles product-detail page interactions (rings, studs, etc.).
 */
class ProductPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Product title
    this.productTitle = page.locator('h1').first();

    // Add-to-cart submit button — type="submit" inside the product form
    this.addToCartBtn = page.locator('form button[type="submit"]').first();
  }

  /**
   * Navigate to the studs category and click the first product.
   * @returns {Promise<string>} URL of the selected product page
   */
  async selectFirstRingProduct() {
    await this.page.goto('https://devbox.gagediamonds.com/jewelry/earrings/studs/');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000);

    const firstProduct = this.page.locator('article a').first();
    await firstProduct.waitFor({ state: 'visible', timeout: TIMEOUTS.domReady });
    await firstProduct.click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1000);
    return this.page.url();
  }

  /**
   * Select the first available metal option.
   * Rings use radio buttons; studs use a combobox.
   */
  async selectFirstMetal() {
    const metalRadios = this.page.getByRole('radio');
    if ((await metalRadios.count()) > 0) {
      await metalRadios.first().click();
      return;
    }

    // Studs: metal is a combobox
    const metalCombobox = this.page.getByRole('combobox').first();
    if (await metalCombobox.isVisible().catch(() => false)) {
      await metalCombobox.click();
      await this.page.waitForSelector('[role="option"]', { timeout: TIMEOUTS.short }).catch(() => {});
      await this.page.evaluate(() => {
        const options = document.querySelectorAll('[role="option"]');
        if (options.length > 0) options[0].click();
      });
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Select a ring size from the size combobox.
   * Silently skips if no size selector is present (e.g. studs).
   * @param {string|null} size - Exact size label (e.g. "5.00"), or null for first available
   */
  async selectRingSize(size = null) {
    const comboboxes = this.page.getByRole('combobox');
    const count = await comboboxes.count();
    if (count === 0) return;

    // Rings: first combobox = size; studs with metal already handled: use second
    const sizeCombobox = count > 1 ? comboboxes.nth(1) : comboboxes.first();
    const ariaLabel    = await sizeCombobox.getAttribute('aria-label').catch(() => '');

    if (ariaLabel && ariaLabel.toLowerCase().includes('metal')) return;

    await sizeCombobox.click();
    await this.page.waitForSelector('[role="option"]', { timeout: TIMEOUTS.short }).catch(() => {});

    await this.page.evaluate((targetSize) => {
      const options = Array.from(document.querySelectorAll('[role="option"]'));
      if (!options.length) return;
      const target = targetSize
        ? options.find(o => o.textContent.trim() === targetSize) || options[0]
        : options[0];
      target.click();
    }, size);

    await this.page.waitForTimeout(500);
  }

  /**
   * Check all required (aria-required="true") checkboxes that are unchecked.
   */
  async checkRequiredCheckboxes() {
    const checkboxes = this.page.getByRole('checkbox');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const cb       = checkboxes.nth(i);
      const state    = await cb.getAttribute('data-state');
      const required = await cb.getAttribute('aria-required');
      if (required === 'true' && state === 'unchecked') {
        await cb.click();
      }
    }
  }

  /**
   * Return the displayed product price (e.g. "$852.50"), or null if not found.
   * @returns {Promise<string|null>}
   */
  async getProductPrice() {
    return this.page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('*')).find(
        e => e.children.length === 0 && /^\$[\d,]+(\.\d{2})?$/.test(e.textContent.trim())
      );
      return el ? el.textContent.trim() : null;
    });
  }

  /**
   * Return the product title text from the <h1>.
   * @returns {Promise<string>}
   */
  async getProductTitle() {
    return this.productTitle.textContent();
  }

  /**
   * Click Add to Cart and wait for the cart API call to complete.
   */
  async addToCart() {
    await this.addToCartBtn.click();
    try {
      await this.page.waitForFunction(() => {
        const btn = document.querySelector('form button[type="submit"]');
        return btn && btn.getAttribute('aria-busy') !== 'true';
      }, { timeout: TIMEOUTS.medium });
    } catch {
      await this.page.waitForTimeout(2000);
    }
    await this.page.waitForTimeout(1000);
  }
}

module.exports = { ProductPage };