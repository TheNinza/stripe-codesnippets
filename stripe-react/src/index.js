import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { FirebaseAppProvider } from "reactfire";

export const stripePromise = loadStripe(
  "pk_test_51HytdnG6rUbsulVXed5xUVd6pCBjpL2IF615zGIfT3pGgqz8aj31JdDizRJ2d75oi9BJLxcHUpHpeWuRqWuCmaCP00FYfhASVm"
);

export const firebaseConfig = {
  apiKey: "AIzaSyD5c8BYElga2XssNRu7tx8smUF9osegqko",
  authDomain: "stripe-tut-fire.firebaseapp.com",
  projectId: "stripe-tut-fire",
  storageBucket: "stripe-tut-fire.appspot.com",
  messagingSenderId: "549424785052",
  appId: "1:549424785052:web:78b4403e6223bbd8676f59",
};

ReactDOM.render(
  <React.StrictMode>
    <FirebaseAppProvider firebaseConfig={firebaseConfig}>
      <Elements stripe={stripePromise}>
        <App />
      </Elements>
    </FirebaseAppProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
