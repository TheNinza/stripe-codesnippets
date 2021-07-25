// Environment Variables (Stripe API Key)
import { config } from "dotenv";
if (process.env.NODE_ENV !== "production") {
  config();
}

// initialising stripe
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET, {
  apiVersion: "2020-08-27",
});

// start the api with express
import { app } from "./api";

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log("App running on port: " + port);
});
