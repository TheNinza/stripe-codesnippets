import { stripe } from ".";
import Stripe from "stripe";
import { Request, Response } from "express";

import { db } from "./firebase";
import { firestore } from "firebase-admin";

const webhookHandlers = {
  "payment_intent.succeeded": async (data: Stripe.PaymentIntent) => {
    // add business logic here
    console.log("yeahhhhhhh succeeded");
  },
  "payment_intent.payment_failed": async (data: Stripe.PaymentIntent) => {
    // add business logic here
    console.log("oh no failed!!!!!!!!!!!!");
  },

  "charge.succeded": async (data: Stripe.PaymentIntent) => {
    // add business logic here
    console.log("oh Yesssssss created!!!!!!!!!!!");
  },

  "payment_intent.created": async (data: Stripe.PaymentIntent) => {
    // add business logic here
    console.log("oh Yesssssss created!!!!!!!!!!!");
  },

  "customer.subscription.deleted": async (data: Stripe.Subscription) => {
    const customer = (await stripe.customers.retrieve(
      data.customer as string
    )) as Stripe.Customer;
    const userId = customer.metadata.firebaseUID;
    const userRef = db.collection("users").doc(userId);

    await userRef.update({
      activePlans: firestore.FieldValue.arrayRemove(data.id),
    });
  },
  "customer.subscription.created": async (data: Stripe.Subscription) => {
    const customer = (await stripe.customers.retrieve(
      data.customer as string
    )) as Stripe.Customer;
    const userId = customer.metadata.firebaseUID;
    const userRef = db.collection("users").doc(userId);

    console.log("dataaaaaaaaaa", data);

    await userRef.update({
      activePlans: firestore.FieldValue.arrayUnion(data.id),
    });
  },
  "invoice.payment_succeeded": async (data: Stripe.Invoice) => {
    // Add your business logic here
  },
  "invoice.payment_failed": async (data: Stripe.Invoice) => {
    const customer = (await stripe.customers.retrieve(
      data.customer as string
    )) as Stripe.Customer;
    const userSnapshot = await db
      .collection("users")
      .doc(customer.metadata.firebaseUID)
      .get();
    await userSnapshot.ref.update({ status: "PAST_DUE" });
  },
};

/**
 * Validate the stripe webhook secret, then call the handler for the event type
 */

export const handleStripeWebhook = async (req: Request, res: Response) => {
  console.log(req.body, req["rawBody"]);

  const sig = req.headers["stripe-signature"];

  const event = stripe.webhooks.constructEvent(
    req["rawBody"],
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  try {
    await webhookHandlers[event.type](event.data.object);
    res.send({ received: true });
  } catch (error) {
    res.status(400).send({ webhookError: error.message });
  }
};
