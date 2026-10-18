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
import { recordUserLogin, recordUserLogout } from './userActivityService'

export async function ensureUserDocument(user, profile = {}) {
  if (!db || !user) return null

  // Use the Auth UID as the profile document ID so account data stays tied to its owner.
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
    await recordUserLogin(result.user)
  }

  return result.user
}

export async function loginUser({ email, password }) {
  if (!auth || !isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Add your project values to .env first.')
  }

  const result = await signInWithEmailAndPassword(auth, email, password)
  await ensureUserDocument(result.user)
  await recordUserLogin(result.user)
  return result.user
}

export async function loginWithGoogle() {
  if (!auth || !db || !googleProvider || !isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Add your project values to .env first.')
  }

  const result = await signInWithPopup(auth, googleProvider)
  await ensureUserDocument(result.user)
  await recordUserLogin(result.user)
  return result.user
}

export async function logoutUser() {
  if (!auth) return

  let activityError
  if (auth.currentUser) {
    try {
      await recordUserLogout(auth.currentUser.uid)
    } catch (error) {
      activityError = error
    }
  }

  await signOut(auth)
  if (activityError) throw activityError
}

export async function deleteCurrentUserAccount() {
  if (!auth || !auth.currentUser) {
    throw new Error('No authenticated user available to delete.')
  }

  await deleteUser(auth.currentUser)
}
