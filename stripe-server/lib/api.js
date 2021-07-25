"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPaymentMethods = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const checkout_1 = require("./checkout");
const payments_1 = require("./payments");
const webhooks_1 = require("./webhooks");
const firebase_1 = require("./firebase");
const customers_1 = require("./customers");
const _1 = require(".");
const billing_1 = require("./billing");
exports.app = express_1.default();
// app.use(express.json());
exports.app.use(cors_1.default({ origin: true }));
exports.app.use(morgan_1.default("tiny"));
exports.app.use(decodeJWT);
// sets rawBody for webhook handling
exports.app.use(express_1.default.json({
    verify: (req, res, buffer) => {
        req["rawBody"] = buffer;
    },
}));
exports.app.post("/test", (req, res) => {
    console.log(req.body);
    const amount = req.body.amount;
    res.status(200).send({ with_tax: amount * 7 });
});
exports.app.post("/checkouts/", runAsync(async ({ body }, res) => {
    res.send(await checkout_1.createStripeCheckoutSession(body.line_items));
}));
exports.app.post("/payments", runAsync(async (req, res) => {
    const user = validateUser(req);
    res.send(await payments_1.createPaymentIntent(req.body.amount, user.uid));
}));
exports.app.post("/wallet", runAsync(async (req, res) => {
    const user = validateUser(req);
    const setupIntent = await customers_1.createSetupIntent(user.uid);
    res.send(setupIntent);
}));
exports.app.get("/wallet", runAsync(async (req, res) => {
    const user = validateUser(req);
    const wallet = await listPaymentMethods(user.uid);
    res.send(wallet.data);
}));
/**
 * Webhooks
 */
// handle webhooks
exports.app.post("/hooks", runAsync(webhooks_1.handleStripeWebhook));
/**
 * Billing and recurring subscription
 */
exports.app.post("/subscriptions", runAsync(async (req, res) => {
    const user = validateUser(req);
    const { plan, payment_method } = req.body;
    const subscription = await billing_1.createSubscription(user.uid, plan, payment_method);
    res.send(subscription);
}));
exports.app.get("/subscriptions", runAsync(async (req, res) => {
    const user = validateUser(req);
    const subscriptions = await billing_1.listSubscriptions(user.uid);
    res.send(subscriptions.data);
}));
exports.app.patch("/subscriptions/:id", runAsync(async (req, res) => {
    const user = validateUser(req);
    res.send(await billing_1.cancelSubscription(user.uid, req.params.id));
}));
/**
 * Decodes JSON web toke sent via the frontend app
 * makes the currentUser (firebase) data available on the body
 */
async function decodeJWT(req, res, next) {
    var _a, _b;
    if ((_b = (_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) === null || _b === void 0 ? void 0 : _b.startsWith("Bearer ")) {
        const idToken = req.headers.authorization.split("Bearer ")[1];
        try {
            const decodedToken = await firebase_1.auth.verifyIdToken(idToken);
            req["currentUser"] = decodedToken;
        }
        catch (err) {
            console.log(err);
        }
    }
    next();
}
/**
 * Throws an error if the currentUser does not exists on the request
 */
function validateUser(req) {
    const user = req["currentUser"];
    if (!user) {
        throw new Error("You must be logged in to make this request. i.e. Authoruzation: Bearer <token>");
    }
    return user;
}
/**
 * Returns all payment sources assocuated to the user
 */
async function listPaymentMethods(userId) {
    const customer = await customers_1.getOrCreateCustomer(userId);
    return _1.stripe.paymentMethods.list({
        customer: customer.id,
        type: "card",
    });
}
exports.listPaymentMethods = listPaymentMethods;
/**
 * catch async errors when awaiting promises
 */
function runAsync(callback) {
    return (req, res, next) => {
        callback(req, res, next).catch(next);
    };
}
//# sourceMappingURL=api.js.map