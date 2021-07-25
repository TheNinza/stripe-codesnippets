"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStripeWebhook = void 0;
const _1 = require(".");
const firebase_1 = require("./firebase");
const firebase_admin_1 = require("firebase-admin");
const webhookHandlers = {
    "payment_intent.succeeded": async (data) => {
        // add business logic here
        console.log("yeahhhhhhh succeeded");
    },
    "payment_intent.payment_failed": async (data) => {
        // add business logic here
        console.log("oh no failed!!!!!!!!!!!!");
    },
    "charge.succeded": async (data) => {
        // add business logic here
        console.log("oh Yesssssss created!!!!!!!!!!!");
    },
    "payment_intent.created": async (data) => {
        // add business logic here
        console.log("oh Yesssssss created!!!!!!!!!!!");
    },
    "customer.subscription.deleted": async (data) => {
        const customer = (await _1.stripe.customers.retrieve(data.customer));
        const userId = customer.metadata.firebaseUID;
        const userRef = firebase_1.db.collection("users").doc(userId);
        await userRef.update({
            activePlans: firebase_admin_1.firestore.FieldValue.arrayRemove(data.id),
        });
    },
    "customer.subscription.created": async (data) => {
        const customer = (await _1.stripe.customers.retrieve(data.customer));
        const userId = customer.metadata.firebaseUID;
        const userRef = firebase_1.db.collection("users").doc(userId);
        console.log("dataaaaaaaaaa", data);
        await userRef.update({
            activePlans: firebase_admin_1.firestore.FieldValue.arrayUnion(data.id),
        });
    },
    "invoice.payment_succeeded": async (data) => {
        // Add your business logic here
    },
    "invoice.payment_failed": async (data) => {
        const customer = (await _1.stripe.customers.retrieve(data.customer));
        const userSnapshot = await firebase_1.db
            .collection("users")
            .doc(customer.metadata.firebaseUID)
            .get();
        await userSnapshot.ref.update({ status: "PAST_DUE" });
    },
};
/**
 * Validate the stripe webhook secret, then call the handler for the event type
 */
const handleStripeWebhook = async (req, res) => {
    console.log(req.body, req["rawBody"]);
    const sig = req.headers["stripe-signature"];
    const event = _1.stripe.webhooks.constructEvent(req["rawBody"], sig, process.env.STRIPE_WEBHOOK_SECRET);
    try {
        await webhookHandlers[event.type](event.data.object);
        res.send({ received: true });
    }
    catch (error) {
        res.status(400).send({ webhookError: error.message });
    }
};
exports.handleStripeWebhook = handleStripeWebhook;
//# sourceMappingURL=webhooks.js.map