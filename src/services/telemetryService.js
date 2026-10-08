import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'

const normalizeTelemetry = (recordId, data = {}) => {
  const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp || new Date()
  const location = data.location || {}

  return {
    id: recordId,
    userId: data.userId || '',
    deviceId: data.deviceId || '',
    deviceName: data.deviceName || 'Unknown Device',
    timestamp,
    location: {
      latitude: Number(location.latitude ?? 0),
      longitude: Number(location.longitude ?? 0),
      accuracy: Number(location.accuracy ?? 0),
      altitude: Number(location.altitude ?? 0),
      speed: Number(location.speed ?? 0),
    },
    gyroscope: {
      x: Number(data.gyroscope?.x ?? 0),
      y: Number(data.gyroscope?.y ?? 0),
      z: Number(data.gyroscope?.z ?? 0),
    },
    accelerometer: {
      x: Number(data.accelerometer?.x ?? 0),
      y: Number(data.accelerometer?.y ?? 0),
      z: Number(data.accelerometer?.z ?? 0),
    },
    batteryLevel: Number(data.batteryLevel ?? 0),
    isCharging: Boolean(data.isCharging),
    networkType: data.networkType || 'Unknown',
    androidVersion: data.androidVersion || 'Unknown',
    deviceModel: data.deviceModel || 'Unknown model',
    appVersion: data.appVersion || 'Unknown',
  }
}

export function subscribeToUserTelemetry(userId, callback) {
  if (!db || !userId) {
    callback([])
    return () => {}
  }

  const q = query(
    collectionGroup(db, 'telemetry'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
  )

  return onSnapshot(q, (snapshot) => {
    const telemetry = snapshot.docs.map((docSnap) => normalizeTelemetry(docSnap.id, docSnap.data()))
    callback(telemetry)
  })
}

export async function getTelemetryForUser(userId) {
  if (!db || !userId) return []

  const q = query(
    collectionGroup(db, 'telemetry'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => normalizeTelemetry(docSnap.id, docSnap.data()))
}

export async function deleteTelemetryForUser(userId) {
  if (!db || !userId) return

  const q = query(
    collectionGroup(db, 'telemetry'),
    where('userId', '==', userId),
  )

  const snapshot = await getDocs(q)
  const batch = writeBatch(db)
  snapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref)
  })

  if (snapshot.docs.length) {
    await batch.commit()
  }
}

export async function deleteTelemetryRecord(userId, recordId) {
  if (!db || !userId || !recordId) return
  await deleteDoc(doc(db, 'users', userId, 'devices', 'placeholder', 'telemetry', recordId))
}
