'use strict';
const { TIMEOUTS } = require('../config/constants');

/**
 * CheckoutPage Page Object
 * URL: https://securedev.gagediamonds.com/checkout
 * BigCommerce hosted checkout — payment fields live in cross-origin iframes.
 */
class CheckoutPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Customer step ──────────────────────────────────────────────────────
    this.emailInput              = page.locator('#email');
    this.continueAsGuestBtn      = page.locator('#checkout-customer-continue');

    // ── Shipping address fields ────────────────────────────────────────────
    this.firstNameInput  = page.locator('#firstNameInput');
    this.lastNameInput   = page.locator('#lastNameInput');
    this.companyInput    = page.locator('#companyInput');
    this.address1Input   = page.locator('#addressLine1Input');
    this.address2Input   = page.locator('#addressLine2Input');
    this.cityInput       = page.locator('#cityInput');
    this.countrySelect   = page.locator('#countryCodeInput');
    this.stateSelect     = page.locator('#provinceCodeInput');
    this.zipInput        = page.locator('#postCodeInput');
    this.phoneInput      = page.locator('#phoneInput');

    // ── Shipping step controls ─────────────────────────────────────────────
    this.shippingContinueBtn  = page.locator('#checkout-shipping-continue');
    this.shippingMethodLabel  = page.locator('label.form-label.optimizedCheckout-form-label').first();
  }

  // ── Customer step ──────────────────────────────────────────────────────────

  /**
   * Enter email and click Continue / Sign In.
   * @param {string} email
   */
  async enterEmailAndContinue(email) {
    await this.emailInput.waitFor({ state: 'visible', timeout: TIMEOUTS.domReady });
    await this.emailInput.fill(email);
    await this.continueAsGuestBtn.click();
    await this.page.waitForTimeout(2000);
  }

  // ── Shipping address ───────────────────────────────────────────────────────

  /**
   * Fill the shipping address form.
   * If a saved address is pre-selected, attempts to open the edit form first.
   * @param {{ firstName?, lastName?, company?, address1?, address2?, city?, state?, zip?, phone? }} data
   */
  async fillShippingAddress(data) {
    const isFormVisible = await this.firstNameInput.isVisible().catch(() => false);

    if (!isFormVisible) {
      // Saved address pre-selected — try to open the edit form
      try {
        const editBtn = this.page.locator('button:has-text("Edit"), a:has-text("Edit"), button:has-text("Change")').first();
        if (await editBtn.isVisible().catch(() => false)) {
          await editBtn.click();
          await this.page.waitForTimeout(1000);
        }
      } catch { /* no edit button */ }

      if (!(await this.firstNameInput.isVisible().catch(() => false))) {
        console.log('Using pre-saved shipping address');
        return;
      }
    }

    await this.firstNameInput.fill(data.firstName || 'Arizon');
    await this.lastNameInput.fill(data.lastName   || 'Solutions Inc.');
    await this.companyInput.fill(data.company     || '');
    await this.address1Input.fill(data.address1   || '');
    await this.address2Input.fill(data.address2   || '');
    await this.cityInput.fill(data.city           || '');
    await this.countrySelect.selectOption('United States');
    await this.page.waitForTimeout(1000); // wait for state dropdown to populate
    await this.stateSelect.selectOption(data.state || 'Texas');
    await this.zipInput.fill(data.zip             || '');

    try {
      await this.phoneInput.waitFor({ state: 'visible', timeout: TIMEOUTS.short });
      await this.phoneInput.fill(data.phone || '2815551234');
    } catch { /* phone field may not be visible */ }
  }

  /**
   * Click the Continue button on the shipping address step.
   * Checkout may auto-advance to order-confirmation if payment is pre-saved.
   */
  async continueFromShipping() {
    try {
      await this.shippingContinueBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.medium });
      await this.shippingContinueBtn.click();
      await this.page.waitForTimeout(2000);
    } catch {
      console.log('Shipping continue button not visible — checkout may have auto-advanced');
    }
  }

  // ── Shipping method ────────────────────────────────────────────────────────

  /**
   * Select the first available shipping method and click Continue.
   */
  async selectShippingMethodAndContinue() {
    try {
      await this.shippingMethodLabel.waitFor({ state: 'visible', timeout: TIMEOUTS.medium });
      await this.shippingMethodLabel.click();
      await this.page.waitForTimeout(1000);
    } catch {
      console.log('Shipping method label not visible — may already be selected');
    }

    if (!this.page.url().includes('order-confirmation')) {
      try {
        await this.shippingContinueBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.short });
        await this.shippingContinueBtn.click();
      } catch { /* already navigated or button not present */ }
    }
    await this.page.waitForTimeout(2000);
  }

  // ── Payment ────────────────────────────────────────────────────────────────

  /**
   * Fill credit card details via BigCommerce hosted payment iframes (cross-origin).
   * @param {{ cardNumber: string, expiry: string, cvv: string, nameOnCard?: string }} cardData
   */
  async fillCreditCardDetails(cardData) {
    const iframeCount = await this.page.locator('fieldset.form-fieldset iframe').count();
    if (iframeCount === 0) {
      console.log('No payment iframes found — payment may use a different method');
      return;
    }

    const iframeSelector = 'fieldset.form-fieldset iframe';

    // Card number (first iframe)
    try {
      const cardInput = this.page.frameLocator(iframeSelector).first().locator('input').first();
      await cardInput.waitFor({ state: 'visible', timeout: TIMEOUTS.medium });
      await cardInput.fill(cardData.cardNumber.replace(/\s/g, ''));
    } catch (e) { console.log('Card number iframe fill failed:', e.message); }

    // Expiry (second iframe)
    try {
      const expiryInput = this.page.frameLocator(iframeSelector).nth(1).locator('input').first();
      await expiryInput.waitFor({ state: 'visible', timeout: TIMEOUTS.short });
      await expiryInput.fill(cardData.expiry);
    } catch (e) { console.log('Expiry iframe fill failed:', e.message); }

    // CVV (third iframe)
    try {
      const cvvInput = this.page.frameLocator(iframeSelector).nth(2).locator('input').first();
      await cvvInput.waitFor({ state: 'visible', timeout: TIMEOUTS.short });
      await cvvInput.fill(cardData.cvv);
    } catch (e) { console.log('CVV iframe fill failed:', e.message); }

    // Name on Card (regular input, not in an iframe)
    try {
      await this.page.getByLabel('Name on Card').fill(cardData.nameOnCard || 'Arizon Solutions Inc.');
    } catch (e) { console.log('Name on card fill failed:', e.message); }
  }

  /**
   * Click the Place Order button.
   * Tries multiple selectors used by BigCommerce checkout themes.
   */
  async placeOrder() {
    const selectors = [
      '#checkout-payment-continue',
      'button[data-test="payment-form-submit"]',
      'button.button--primary',
      'button[type="submit"]',
    ];

    let placed = false;
    for (const sel of selectors) {
      try {
        const btn = this.page.locator(sel).first();
        if (await btn.isVisible().catch(() => false)) {
          await btn.click();
          placed = true;
          break;
        }
      } catch { /* try next */ }
    }

    if (!placed) {
      await this.page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button[type="submit"]'))
          .find(b => b.offsetParent !== null);
        if (btn) btn.click();
      });
    }

    await this.page.waitForTimeout(5000);
  }
}

module.exports = { CheckoutPage };