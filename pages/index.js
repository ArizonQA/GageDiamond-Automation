/**
 * Barrel export — import all page objects from a single entry point.
 *
 * Usage:
 *   const { HomePage, LoginPage, ProductPage, CartPage, CheckoutPage } = require('../pages');
 */
const { HomePage }     = require('./HomePage');
const { LoginPage }    = require('./LoginPage');
const { ProductPage }  = require('./ProductPage');
const { CartPage }     = require('./CartPage');
const { CheckoutPage } = require('./CheckoutPage');

module.exports = { HomePage, LoginPage, ProductPage, CartPage, CheckoutPage };