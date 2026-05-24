import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyBxHCRPBUa_i5878gOHCJrcwTHZJZRR6jo',
  authDomain: 'pokemon-cards-e6131.firebaseapp.com',
  databaseURL: 'https://pokemon-cards-e6131-default-rtdb.firebaseio.com',
  projectId: 'pokemon-cards-e6131',
  storageBucket: 'pokemon-cards-e6131.firebasestorage.app',
  messagingSenderId: '527616159916',
  appId: '1:527616159916:web:6834ee541cf94c99cb2f09'
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function generateShareCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function getShareCode() {
  const saved = localStorage.getItem('current_share_code');
  if (saved) {
    return saved;
  }
  return null;
}

async function setShareCode(code) {
  localStorage.setItem('current_share_code', code);
}

async function loadOwnedCardsFromFirebase(shareCode) {
  try {
    const cardsRef = ref(database, `collections/${shareCode}`);
    const snapshot = await get(cardsRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return {};
  } catch (error) {
    console.error('Error loading cards from Firebase:', error);
    return {};
  }
}

async function saveOwnedCardsToFirebase(cards, shareCode) {
  try {
    const cardsRef = ref(database, `collections/${shareCode}`);
    await set(cardsRef, cards);
  } catch (error) {
    console.error('Error saving cards to Firebase:', error);
  }
}

function listenToOwnedCards(shareCode, callback) {
  const cardsRef = ref(database, `collections/${shareCode}`);
  const unsubscribe = onValue(cardsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });
  return unsubscribe;
}

async function removeShareCode(code) {
  try {
    const shareRef = ref(database, `collections/${code}`);
    await remove(shareRef);
  } catch (error) {
    console.error('Error removing share code:', error);
  }
}

export {
  getShareCode,
  setShareCode,
  loadOwnedCardsFromFirebase,
  saveOwnedCardsToFirebase,
  listenToOwnedCards,
  removeShareCode,
  generateShareCode,
};
