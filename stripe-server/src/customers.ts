import { stripe } from ".";
import { db } from "./firebase";
import Stripe from "stripe";

/**
 * Gets the existing Stripe customer or creates a new record
 */

export async function getOrCreateCustomer(
  userId: string,
  params?: Stripe.CustomerCreateParams
) {
  const userSnapshot = await db.collection("users").doc(userId).get();

  const { stripeCustomerId, email } = userSnapshot.data();

  // if mission customerId

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        firebaseUID: userId,
      },
      ...params,
    });

    await userSnapshot.ref.update({ stripeCustomerId: customer.id });
    return customer;
  } else {
    return (await stripe.customers.retrieve(
      stripeCustomerId
    )) as Stripe.Customer;
  }
}

export async function createSetupIntent(userId: string) {
  const customer = await getOrCreateCustomer(userId);

  return stripe.setupIntents.create({
    customer: customer.id,
  });
}
