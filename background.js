// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJHTzachRxvoy2dvDcmbCtHtRvpzc1CAQ",
  authDomain: "scraper-e1558.firebaseapp.com",
  projectId: "scraper-e1558",
  storageBucket: "scraper-e1558.appspot.com",
  messagingSenderId: "474934068501",
  appId: "1:474934068501:web:335d7bf6a8cb4cfa36d51c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


chrome.runtime.onInstalled.addListener(() => {
  console.log('GMB Scraper extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetch_analytics_data') {
    fetchAnalyticsData(request.url).then(data => sendResponse(data));
    return true;  // Will respond asynchronously.
  }
});

async function fetchAnalyticsData(url) {
  const response = await fetch(url);
  const text = await response.text();

  const googleAnalytics = /UA-\d{4,9}-\d{1,4}/.test(text);
  const facebookPixel = /facebook\.com\/tr\?id=\d+/.test(text);
  const googleTag = /www.googletagmanager.com\/gtm.js/.test(text);
  const googleAds = /ads.google.com/.test(text);

  return { googleAnalytics, facebookPixel, googleTag, googleAds };
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.action.onClicked.addListener(async (tab) => {
  const userId = await getUserId(); // Implement this function to get user ID, e.g., prompt for email

  const response = await fetch('https://your-firebase-function-url/checkSubscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId: userId })
  });
  const result = await response.json();

  if (result.isSubscriber) {
    alert('You are already subscribed!');
  } else {
    const sessionResponse = await fetch('https://your-firebase-function-url/createCheckoutSession', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: userId })
    });
    const session = await sessionResponse.json();

    const stripe = Stripe('pk_test_51OJ1r3GuyLn0HMXAnY26F0A901ivuAezuonijnD4tP40toFnVYuzWBIQwtJBke5r64p29XdQmRjsKodwIILIqbys00Rvo00nKO');
    await stripe.redirectToCheckout({ sessionId: session.id });
  }
});

async function getUserId() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['userId'], (result) => {
      if (result.userId) {
        resolve(result.userId);
      } else {
        const userId = prompt('Please enter your email:');
        chrome.storage.sync.set({ userId: userId }, () => {
          resolve(userId);
        });
      }
    });
  });
}