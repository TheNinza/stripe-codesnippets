import firebase from "firebase";
import "firebase/auth";
import "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyD5c8BYElga2XssNRu7tx8smUF9osegqko",
  authDomain: "stripe-tut-fire.firebaseapp.com",
  projectId: "stripe-tut-fire",
  storageBucket: "stripe-tut-fire.appspot.com",
  messagingSenderId: "549424785052",
  appId: "1:549424785052:web:78b4403e6223bbd8676f59",
};

firebase.initializeApp(firebaseConfig);

export const db = firebase.firestore();
export const auth = firebase.auth();
