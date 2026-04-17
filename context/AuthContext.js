'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userDp, setUserDp] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: persist role to localStorage so it survives Firestore offline errors
  const persistRole = (role) => {
    if (role) {
      localStorage.setItem('medassist_role', role);
      setUserRole(role);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            persistRole(data.role);
            if (data.photoURL) setUserDp(data.photoURL);
            else setUserDp(null);
          } else {
            // Firestore doc missing — fall back to localStorage
            const savedRole = localStorage.getItem('medassist_role');
            if (savedRole) setUserRole(savedRole);
          }
        } catch (err) {
          console.error('Firestore error in auth state:', err.message);
          // Firestore offline — use cached role from localStorage
          const savedRole = localStorage.getItem('medassist_role');
          if (savedRole) setUserRole(savedRole);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUserDp(null);
        localStorage.removeItem('medassist_role');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signup = async (email, password, role) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', result.user.uid), {
      email: result.user.email,
      role: role,
      createdAt: new Date().toISOString(),
    });
    persistRole(role);
    return result;
  };

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    try {
      const docRef = doc(db, 'users', result.user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        persistRole(data.role);
        if (data.photoURL) setUserDp(data.photoURL);
      }
    } catch (err) {
      console.error('Firestore error on login:', err.message);
      const savedRole = localStorage.getItem('medassist_role');
      if (savedRole) setUserRole(savedRole);
    }
    return result;
  };

  const loginWithGoogle = async (role) => {
    const result = await signInWithPopup(auth, googleProvider);
    try {
      const docRef = doc(db, 'users', result.user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists() && role) {
        await setDoc(docRef, {
          email: result.user.email,
          role: role,
          createdAt: new Date().toISOString(),
        });
        persistRole(role);
      } else if (docSnap.exists()) {
        const data = docSnap.data();
        persistRole(data.role);
        if (data.photoURL) setUserDp(data.photoURL);
      }
    } catch (err) {
      console.error('Firestore error on Google login:', err.message);
      const savedRole = localStorage.getItem('medassist_role');
      if (savedRole) setUserRole(savedRole);
      else if (role) persistRole(role);
    }
    return result;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserRole(null);
    setUserDp(null);
  };

  const updateProfileData = async (displayName, photoURL, newRole) => {
    if (!user) return;
    
    // Update Firebase Auth profile (ONLY DISPLAY NAME)
    if (displayName !== undefined && displayName !== user.displayName) {
      await updateProfile(user, { displayName });
      setUser({ ...user, displayName }); 
    }

    // Update Firestore Role & Photo
    const firestoreUpdates = {};
    if (newRole !== undefined && newRole !== userRole) firestoreUpdates.role = newRole;
    if (photoURL !== undefined) firestoreUpdates.photoURL = photoURL;

    if (Object.keys(firestoreUpdates).length > 0) {
      try {
        const docRef = doc(db, 'users', user.uid);
        await updateDoc(docRef, firestoreUpdates);
        
        if (firestoreUpdates.role) persistRole(firestoreUpdates.role);
        if (firestoreUpdates.photoURL) setUserDp(firestoreUpdates.photoURL);
      } catch (err) {
        console.error('Error updating Firestore document:', err.message);
        if (firestoreUpdates.role) persistRole(firestoreUpdates.role); // Fallback caching
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, userDp, loading, signup, login, loginWithGoogle, logout, updateProfileData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
