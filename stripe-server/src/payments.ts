import { stripe } from ".";
import { getOrCreateCustomer } from "./customers";

/**
 * Create a payment intent with a specific amount
 */

export async function createPaymentIntent(amount: number, userId: string) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "inr",
    customer: (await getOrCreateCustomer(userId)).id,
  });

  return paymentIntent;
}
