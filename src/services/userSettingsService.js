import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'

export function subscribeToUserSettings(userId, onChange, onError) {
  if (!db || !userId) {
    onError(new Error('Firebase is not configured or the user is not signed in.'))
    return () => {}
  }

  return onSnapshot(
    doc(db, 'users', userId),
    (snapshot) => onChange(snapshot.data() || {}),
    onError,
  )
}

export async function updateTelemetryInterval(userId, intervalMinutes) {
  if (!db || !userId) {
    throw new Error('Firebase is not configured or the user is not signed in.')
  }

  await setDoc(doc(db, 'users', userId), { telemetryIntervalMinutes: intervalMinutes }, { merge: true })
}
