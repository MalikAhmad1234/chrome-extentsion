/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")("sk_test_51OJ1r3GuyLn0HMXAWWkb7LECWEagqkG9T74KNEiHMHiwQKdTR3sJNSRu1Zp9cKq1Y5dt16qlHsoefEAbN9TeieVB00tf7Obz9T");

admin.initializeApp();
const db = admin.firestore();

exports.checkSubscription = functions.https.onRequest(async (req, res) => {
  const { userId } = req.body;

  const customerRef = db.collection("customers").doc(userId);
  const customerDoc = await customerRef.get();

  if (!customerDoc.exists) {
    res.status(200).send({ isSubscriber: false });
    return;
  }

  const customer = customerDoc.data();
  const subscriptions = await stripe.subscriptions.list({
    customer: customer.stripeCustomerId,
    status: "active",
  });

  if (subscriptions.data.length > 0) {
    res.status(200).send({ isSubscriber: true });
  } else {
    res.status(200).send({ isSubscriber: false });
  }
});

exports.createCheckoutSession = functions.https.onRequest(async (req, res) => {
  const { userId } = req.body;

  const customerDoc = await db.collection("customers").doc(userId).get();
  let customer;

  if (!customerDoc.exists) {
    customer = await stripe.customers.create({
      email: userId,
    });
    await db.collection("customers").doc(userId).set({
      stripeCustomerId: customer.id,
    });
  } else {
    customer = customerDoc.data();
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price: "price_1Hh1Y2GNBz5A7QxZyJ2I8sby", // Your price ID
        quantity: 1,
      },
    ],
    mode: "subscription",
    customer: customer.stripeCustomerId,
    success_url: "https://your-success-url",
    cancel_url: "https://your-cancel-url",
  });

  res.status(200).send({ id: session.id });
});
