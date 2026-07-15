'use strict';
const { URLS, TIMEOUTS } = require('../config/constants');

/**
 * HomePage Page Object
 * URL: https://devbox.gagediamonds.com/
 */
class HomePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Cookie banner — data-testid="cookie-banner-accept-button"
    this.cookieAcceptBtn = page.getByTestId('cookie-banner-accept-button');

    // Primary nav — "JEWELRY" is the second <li> in the nav
    this.jewelryNavItem = page.locator('nav ul li').nth(1);

    // Rings link inside Jewelry dropdown — href="/jewelry/rings/"
    this.ringsLink = page.locator('a[href="/jewelry/rings/"]').first();
  }

  /** Navigate to the homepage. */
  async goto() {
    await this.page.goto(URLS.home);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Dismiss the cookie consent banner if it appears.
   * Silently skips if the banner is not present.
   */
  async acceptCookies() {
    try {
      await this.cookieAcceptBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.short });
      await this.cookieAcceptBtn.click();
    } catch {
      // Banner may not appear on every visit — safe to ignore
    }
  }

  /**
   * Hover over the Jewelry nav item and click the Rings link.
   * Waits for navigation to the rings category page.
   */
  async navigateToJewelryRings() {
    await this.jewelryNavItem.hover();
    await this.ringsLink.waitFor({ state: 'visible', timeout: TIMEOUTS.short });
    await this.ringsLink.click();
    await this.page.waitForURL('**/jewelry/rings/**');
  }
}

module.exports = { HomePage };