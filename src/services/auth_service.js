// Firebase v10 CDN module imports
let firebaseApp = null;
let firebaseAuth = null;
let isRealFirebase = false;

// Simulated State (Local Storage fallback)
const MOCK_USER_KEY = 'aether_mock_user';
const FIREBASE_CONFIG_KEY = 'aether_firebase_config';

// Load existing firebase config from localStorage
export function getSavedFirebaseConfig() {
  const saved = localStorage.getItem(FIREBASE_CONFIG_KEY);
  return saved ? JSON.parse(saved) : null;
}

export function saveFirebaseConfig(config) {
  if (!config || !config.apiKey) {
    localStorage.removeItem(FIREBASE_CONFIG_KEY);
    return;
  }
  localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
}

// Initialize Firebase dynamically
export async function initFirebase() {
  const config = getSavedFirebaseConfig();
  if (config && config.apiKey && config.authDomain && config.projectId) {
    try {
      // Dynamic imports from official Google CDN
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
      const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
      
      firebaseApp = initializeApp(config);
      firebaseAuth = getAuth(firebaseApp);
      isRealFirebase = true;
      console.log("[Auth] Firebase Auth initialized successfully using custom config.");
      return true;
    } catch (err) {
      console.error("[Auth] Failed to initialize Firebase with provided config:", err);
      isRealFirebase = false;
    }
  }
  
  console.log("[Auth] Running in simulated authentication mode.");
  isRealFirebase = false;
  return false;
}

// Sign Up Handler
export async function signUp(email, password, displayName = "") {
  if (isRealFirebase && firebaseAuth) {
    const { createUserWithEmailAndPassword, updateProfile } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName || displayName,
      tier: 'free'
    };
  } else {
    // Simulated Signup
    const users = JSON.parse(localStorage.getItem('aether_mock_users') || '[]');
    if (users.find(u => u.email === email)) {
      throw new Error("auth/email-already-in-use");
    }
    const newUser = {
      uid: 'mock-' + Math.random().toString(36).substr(2, 9),
      email,
      displayName: displayName || email.split('@')[0],
      tier: 'free'
    };
    users.push(newUser);
    localStorage.setItem('aether_mock_users', JSON.stringify(users));
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(newUser));
    triggerAuthListeners(newUser);
    return newUser;
  }
}

// Sign In Handler
export async function signIn(email, password) {
  if (isRealFirebase && firebaseAuth) {
    const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    // Fetch subscription details (usually stored in Firestore/RTDB, we fallback to local storage sync for details)
    const user = userCredential.user;
    const tier = localStorage.getItem(`aether_tier_${user.uid}`) || 'free';
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      tier
    };
  } else {
    // Simulated Signin
    const users = JSON.parse(localStorage.getItem('aether_mock_users') || '[]');
    const matched = users.find(u => u.email === email);
    if (!matched) {
      throw new Error("auth/user-not-found");
    }
    // Simple password validation simulation (any password matching length > 5 works)
    if (password.length < 5) {
      throw new Error("auth/wrong-password");
    }
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(matched));
    triggerAuthListeners(matched);
    return matched;
  }
}

// Sign Out Handler
export async function logout() {
  if (isRealFirebase && firebaseAuth) {
    const { signOut } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    await signOut(firebaseAuth);
  }
  localStorage.removeItem(MOCK_USER_KEY);
  triggerAuthListeners(null);
}

// Auth State Change Listeners
const listeners = new Set();

export async function checkAuthState(callback) {
  listeners.add(callback);
  
  if (isRealFirebase && firebaseAuth) {
    const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        const tier = localStorage.getItem(`aether_tier_${user.uid}`) || 'free';
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          tier
        });
      } else {
        callback(null);
      }
    });
  } else {
    // Simulated callback
    const active = localStorage.getItem(MOCK_USER_KEY);
    if (active) {
      const user = JSON.parse(active);
      // Ensure sync tier
      user.tier = localStorage.getItem(`aether_tier_${user.uid}`) || user.tier || 'free';
      callback(user);
    } else {
      callback(null);
    }
  }
}

function triggerAuthListeners(user) {
  listeners.forEach(cb => {
    try {
      cb(user);
    } catch (e) {
      console.error(e);
    }
  });
}
