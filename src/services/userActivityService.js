import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import packageInfo from '../../package.json'
import { db } from '../firebase/firebase'

export const USER_ACTIVITY_TIMEOUT_MS = 5 * 60 * 1000

const activityRef = (userId) => doc(db, 'userActivity', userId)
const appVersion = packageInfo.version

export async function ensureUserActivityDocument(userId) {
  if (!db || !userId) throw new Error('A signed-in user is required to initialize activity.')

  const ref = activityRef(userId)
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref)
    if (snapshot.exists()) return

    transaction.set(ref, {
      uid: userId,
      lastLoginAt: null,
      lastActiveAt: null,
      lastLogoutAt: null,
      appVersion,
      foregroundAt: null,
      isForeground: typeof document === 'undefined' || !document.hidden,
    })
  })
}

export async function recordUserLogin(user) {
  if (!db || !user?.uid) throw new Error('A signed-in user is required to record login activity.')

  const ref = activityRef(user.uid)
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref)
    transaction.set(
      ref,
      {
        uid: user.uid,
        lastLoginAt: serverTimestamp(),
        lastActiveAt: snapshot.exists() ? snapshot.data().lastActiveAt ?? null : null,
        lastLogoutAt: snapshot.exists() ? snapshot.data().lastLogoutAt ?? null : null,
        appVersion,
        foregroundAt: null,
        isForeground: false,
      },
      { merge: true },
    )
  })
}

export async function updateUserActivity(userId) {
  if (!db || !userId) throw new Error('A signed-in user is required to update activity.')

  await setDoc(
    activityRef(userId),
    {
      uid: userId,
      lastActiveAt: serverTimestamp(),
      appVersion,
      isForeground: true,
    },
    { merge: true },
  )
}

export async function updateUserForegroundState(userId, isForeground) {
  if (!db || !userId) throw new Error('A signed-in user is required to update foreground state.')

  await setDoc(
    activityRef(userId),
    {
      uid: userId,
      appVersion,
      foregroundAt: isForeground ? serverTimestamp() : null,
      isForeground,
    },
    { merge: true },
  )
}

export async function recordUserLogout(userId) {
  if (!db || !userId) throw new Error('A signed-in user is required to record logout activity.')

  await setDoc(
    activityRef(userId),
    {
      uid: userId,
      lastLogoutAt: serverTimestamp(),
      appVersion,
      foregroundAt: null,
      isForeground: false,
    },
    { merge: true },
  )
}

export function subscribeToUserActivity(callback, onError) {
  if (!db) {
    onError?.(new Error('Firebase is not configured.'))
    return () => {}
  }

  const activityQuery = query(
    collection(db, 'userActivity'),
    orderBy('lastActiveAt', 'desc'),
    orderBy('lastLoginAt', 'desc'),
  )

  return onSnapshot(
    activityQuery,
    (snapshot) => {
      callback(snapshot.docs.map((activityDoc) => ({ id: activityDoc.id, ...activityDoc.data() })))
    },
    (error) => onError?.(error),
  )
}
