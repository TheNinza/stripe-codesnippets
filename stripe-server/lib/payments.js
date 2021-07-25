"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentIntent = void 0;
const _1 = require(".");
const customers_1 = require("./customers");
/**
 * Create a payment intent with a specific amount
 */
async function createPaymentIntent(amount, userId) {
    const paymentIntent = await _1.stripe.paymentIntents.create({
        amount,
        currency: "inr",
        customer: (await customers_1.getOrCreateCustomer(userId)).id,
    });
    return paymentIntent;
}
exports.createPaymentIntent = createPaymentIntent;
//# sourceMappingURL=payments.js.map