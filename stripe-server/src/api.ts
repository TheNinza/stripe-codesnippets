import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { createStripeCheckoutSession } from "./checkout";
import { createPaymentIntent } from "./payments";
import { handleStripeWebhook } from "./webhooks";
import { auth } from "./firebase";
import { createSetupIntent, getOrCreateCustomer } from "./customers";
import { stripe } from ".";
import {
  cancelSubscription,
  createSubscription,
  listSubscriptions,
} from "./billing";

export const app = express();

// app.use(express.json());
app.use(cors({ origin: true }));
app.use(morgan("tiny"));
app.use(decodeJWT);
// sets rawBody for webhook handling
app.use(
  express.json({
    verify: (req, res, buffer) => {
      req["rawBody"] = buffer;
    },
  })
);

app.post("/test", (req: Request, res: Response) => {
  console.log(req.body);
  const amount = req.body.amount;
  res.status(200).send({ with_tax: amount * 7 });
});

app.post(
  "/checkouts/",
  runAsync(async ({ body }: Request, res: Response) => {
    res.send(await createStripeCheckoutSession(body.line_items));
  })
);

app.post(
  "/payments",
  runAsync(async (req: Request, res: Response) => {
    const user = validateUser(req);
    res.send(await createPaymentIntent(req.body.amount, user.uid));
  })
);

app.post(
  "/wallet",
  runAsync(async (req: Request, res: Response) => {
    const user = validateUser(req);
    const setupIntent = await createSetupIntent(user.uid);
    res.send(setupIntent);
  })
);

app.get(
  "/wallet",
  runAsync(async (req: Request, res: Response) => {
    const user = validateUser(req);

    const wallet = await listPaymentMethods(user.uid);
    res.send(wallet.data);
  })
);

/**
 * Webhooks
 */

// handle webhooks
app.post("/hooks", runAsync(handleStripeWebhook));

/**
 * Billing and recurring subscription
 */
app.post(
  "/subscriptions",
  runAsync(async (req: Request, res: Response) => {
    const user = validateUser(req);
    const { plan, payment_method } = req.body;
    const subscription = await createSubscription(
      user.uid,
      plan,
      payment_method
    );

    res.send(subscription);
  })
);

app.get(
  "/subscriptions",
  runAsync(async (req: Request, res: Response) => {
    const user = validateUser(req);
    const subscriptions = await listSubscriptions(user.uid);

    res.send(subscriptions.data);
  })
);

app.patch(
  "/subscriptions/:id",
  runAsync(async (req: Request, res: Response) => {
    const user = validateUser(req);
    res.send(await cancelSubscription(user.uid, req.params.id));
  })
);

/**
 * Decodes JSON web toke sent via the frontend app
 * makes the currentUser (firebase) data available on the body
 */

async function decodeJWT(req: Request, res: Response, next: NextFunction) {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const idToken = req.headers.authorization.split("Bearer ")[1];

    try {
      const decodedToken = await auth.verifyIdToken(idToken);

      req["currentUser"] = decodedToken;
    } catch (err) {
      console.log(err);
    }
  }
  next();
}

/**
 * Throws an error if the currentUser does not exists on the request
 */

function validateUser(req: Request) {
  const user = req["currentUser"];

  if (!user) {
    throw new Error(
      "You must be logged in to make this request. i.e. Authoruzation: Bearer <token>"
    );
  }
  return user;
}

/**
 * Returns all payment sources assocuated to the user
 */

export async function listPaymentMethods(userId: string) {
  const customer = await getOrCreateCustomer(userId);
  return stripe.paymentMethods.list({
    customer: customer.id,
    type: "card",
  });
}

/**
 * catch async errors when awaiting promises
 */

function runAsync(callback: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    callback(req, res, next).catch(next);
  };
}
