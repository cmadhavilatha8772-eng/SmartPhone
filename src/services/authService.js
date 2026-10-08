import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider, isFirebaseConfigured } from '../firebase/firebase'

export async function ensureUserDocument(user, profile = {}) {
  if (!db || !user) return null

  const userRef = doc(db, 'users', user.uid)
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: profile.name || user.displayName || 'User',
      email: user.email || profile.email || '',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    })
  } else {
    await setDoc(
      userRef,
      {
        name: profile.name || snapshot.data().name || user.displayName || 'User',
        email: user.email || snapshot.data().email || '',
        lastLogin: serverTimestamp(),
      },
      { merge: true },
    )
  }

  return userRef
}

export async function registerUser({ name, email, password }) {
  if (!auth || !isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Add your project values to .env first.')
  }

  const result = await createUserWithEmailAndPassword(auth, email, password)
  if (result.user) {
    await updateProfile(result.user, { displayName: name })
    await ensureUserDocument(result.user, { name, email })
  }

  return result.user
}

export async function loginUser({ email, password }) {
  if (!auth || !isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Add your project values to .env first.')
  }

  const result = await signInWithEmailAndPassword(auth, email, password)
  await ensureUserDocument(result.user)
  return result.user
}

export async function loginWithGoogle() {
  if (!auth || !db || !googleProvider || !isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Add your project values to .env first.')
  }

  const result = await signInWithPopup(auth, googleProvider)
  await ensureUserDocument(result.user)
  return result.user
}

export async function logoutUser() {
  if (!auth) return
  await signOut(auth)
}

export async function deleteCurrentUserAccount() {
  if (!auth || !auth.currentUser) {
    throw new Error('No authenticated user available to delete.')
  }

  await deleteUser(auth.currentUser)
}
