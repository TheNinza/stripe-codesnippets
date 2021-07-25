import { stripe } from ".";
import Stripe from "stripe";
import { db } from "./firebase";
import { getOrCreateCustomer } from "./customers";
import { firestore } from "firebase-admin";

/**
 * Attaches a paymet method to the stripe customer,
 * subscribes to a stripe plan, and saves the plan to firestore
 */

export const createSubscription = async (
  userId: string,
  plan: string,
  payment_method: string
) => {
  const customer = await getOrCreateCustomer(userId);

  // attach the payment method to the customer
  await stripe.paymentMethods.attach(payment_method, { customer: customer.id });

  // set it as the default payment method
  await stripe.customers.update(customer.id, {
    invoice_settings: {
      default_payment_method: payment_method,
    },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ plan }],
    expand: ["latest_invoice.payment_intent"],
  });

  const invoice = subscription.latest_invoice as Stripe.Invoice;
  const payment_intent = invoice.payment_intent as Stripe.PaymentIntent;

  // update the user's status
  if (payment_intent.status === "succeeded") {
    await db
      .collection("users")
      .doc(userId)
      .set(
        {
          stripeCustomerId: customer.id,
          activePlans: firestore.FieldValue.arrayUnion(subscription.id),
        },
        { merge: true }
      );
  }

  return subscription;
};

/**
 * Cancels an active subscription, syncs the data in firestore
 */

export const cancelSubscription = async (
  userId: string,
  subscriptionId: string
) => {
  const customer = await getOrCreateCustomer(userId);

  if (customer.metadata.firebaseUID !== userId) {
    throw Error("Firebase UID doesn't match Stripe customer");
  }

  const subscription = await stripe.subscriptions.del(subscriptionId);

  // cancle at end of the period

  // const subscription = await stripe.subscriptions.update(subscriptionId, {
  //   cancel_at_period_end: true,
  // });

  if (subscription.status === "canceled") {
    await db
      .collection("users")
      .doc(userId)
      .update({
        activePlans: firestore.FieldValue.arrayRemove(subscription.id),
      });
  }

  return subscription;
};

/**
 * Returns all the subscription linked to a firebase userID in Stripe
 */

export const listSubscriptions = async (userId: string) => {
  const customer = await getOrCreateCustomer(userId);

  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
  });

  return subscriptions;
};
