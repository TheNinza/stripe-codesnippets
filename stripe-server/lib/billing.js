"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSubscriptions = exports.cancelSubscription = exports.createSubscription = void 0;
const _1 = require(".");
const firebase_1 = require("./firebase");
const customers_1 = require("./customers");
const firebase_admin_1 = require("firebase-admin");
/**
 * Attaches a paymet method to the stripe customer,
 * subscribes to a stripe plan, and saves the plan to firestore
 */
const createSubscription = async (userId, plan, payment_method) => {
    const customer = await customers_1.getOrCreateCustomer(userId);
    // attach the payment method to the customer
    await _1.stripe.paymentMethods.attach(payment_method, { customer: customer.id });
    // set it as the default payment method
    await _1.stripe.customers.update(customer.id, {
        invoice_settings: {
            default_payment_method: payment_method,
        },
    });
    const subscription = await _1.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ plan }],
        expand: ["latest_invoice.payment_intent"],
    });
    const invoice = subscription.latest_invoice;
    const payment_intent = invoice.payment_intent;
    // update the user's status
    if (payment_intent.status === "succeeded") {
        await firebase_1.db
            .collection("users")
            .doc(userId)
            .set({
            stripeCustomerId: customer.id,
            activePlans: firebase_admin_1.firestore.FieldValue.arrayUnion(subscription.id),
        }, { merge: true });
    }
    return subscription;
};
exports.createSubscription = createSubscription;
/**
 * Cancels an active subscription, syncs the data in firestore
 */
const cancelSubscription = async (userId, subscriptionId) => {
    const customer = await customers_1.getOrCreateCustomer(userId);
    if (customer.metadata.firebaseUID !== userId) {
        throw Error("Firebase UID doesn't match Stripe customer");
    }
    const subscription = await _1.stripe.subscriptions.del(subscriptionId);
    // cancle at end of the period
    // const subscription = await stripe.subscriptions.update(subscriptionId, {
    //   cancel_at_period_end: true,
    // });
    if (subscription.status === "canceled") {
        await firebase_1.db
            .collection("users")
            .doc(userId)
            .update({
            activePlans: firebase_admin_1.firestore.FieldValue.arrayRemove(subscription.id),
        });
    }
    return subscription;
};
exports.cancelSubscription = cancelSubscription;
/**
 * Returns all the subscription linked to a firebase userID in Stripe
 */
const listSubscriptions = async (userId) => {
    const customer = await customers_1.getOrCreateCustomer(userId);
    const subscriptions = await _1.stripe.subscriptions.list({
        customer: customer.id,
    });
    return subscriptions;
};
exports.listSubscriptions = listSubscriptions;
//# sourceMappingURL=billing.js.map