'use strict';
const { URLS, TIMEOUTS } = require('../config/constants');

/**
 * LoginPage Page Object
 * URL: https://devbox.gagediamonds.com/login/
 */
class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Login form — name="email" (text), name="password" (password)
    this.emailInput    = page.locator('input[name="email"][type="text"]');
    this.passwordInput = page.locator('input[name="password"][type="password"]');
    this.loginBtn      = page.locator('button[type="submit"]').first();

    // Registration form (used by createAccount)
    this.regFirstName       = page.locator('#firstName, input[name="firstName"]').first();
    this.regLastName        = page.locator('#lastName, input[name="lastName"]').first();
    this.regEmail           = page.locator('#email, input[name="email"]').first();
    this.regPassword        = page.locator('#password, input[name="password"]').first();
    this.regConfirmPassword = page.locator('#confirmPassword, input[name="confirmPassword"]').first();
    this.regSubmitBtn       = page.locator('button[type="submit"], input[type="submit"]').first();
  }

  /** @returns {boolean} True when the current URL contains /login */
  isOnLoginPage() {
    return this.page.url().includes('/login');
  }

  /**
   * Fill and submit the login form.
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    await this.emailInput.waitFor({ state: 'visible', timeout: TIMEOUTS.domReady });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginBtn.click();
    await this.page.waitForTimeout(TIMEOUTS.short);
  }

  /**
   * Navigate to the create-account page and register a new user.
   * @param {{ email: string, password: string, firstName?: string, lastName?: string }} userData
   */
  async createAccount(userData) {
    await this.page.goto(URLS.createAccount);
    await this.page.waitForLoadState('domcontentloaded');

    await this.regFirstName.fill(userData.firstName || 'Arizon');
    await this.regLastName.fill(userData.lastName   || 'Solutions');
    await this.regEmail.fill(userData.email);
    await this.regPassword.fill(userData.password);

    try {
      await this.regConfirmPassword.fill(userData.password);
    } catch {
      // Confirm-password field may not exist on all store themes
    }

    await this.regSubmitBtn.click();
    await this.page.waitForTimeout(TIMEOUTS.short);
  }

  /**
   * Attempt login; if the account does not exist, register it first.
   * @param {string} email
   * @param {string} password
   */
  async ensureAccountAndLogin(email, password) {
    await this.page.goto(URLS.login);
    await this.page.waitForLoadState('domcontentloaded');
    await this.login(email, password);

    if (this.isOnLoginPage()) {
      // Account not found — register via /register/
      await this.page.goto(URLS.register);
      await this.page.waitForLoadState('domcontentloaded');

      const emailField = this.page.locator('input[name="email"]').first();
      await emailField.waitFor({ state: 'visible', timeout: TIMEOUTS.long });
      await emailField.fill(email);

      const passFields = this.page.locator('input[type="password"]');
      const passCount  = await passFields.count();
      for (let i = 0; i < passCount; i++) {
        await passFields.nth(i).fill(password);
      }

      await this.page.locator('button[type="submit"]').first().click();
      await this.page.waitForTimeout(TIMEOUTS.short);
    }
  }
}

module.exports = { LoginPage };