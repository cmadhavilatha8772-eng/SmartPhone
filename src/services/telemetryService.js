import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'

export const TELEMETRY_PAGE_SIZE = 25

const normalizeTelemetry = (recordId, data = {}, device = {}) => {
  // Firestore timestamps are converted to Date objects for chart and table consumers.
  const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp || null
  const location = data.location || null
  const locationNumber = (value) => {
    if (value == null || value === '') return null
    const number = Number(value)
    return Number.isFinite(number) ? number : null
  }
  const sensorNumber = (value) => {
    if (value == null || value === '') return null
    const number = Number(value)
    return Number.isFinite(number) ? number : null
  }

  return {
    id: recordId,
    userId: data.userId || device.userId || '',
    deviceId: data.deviceId || device.id || '',
    deviceName: data.deviceName || device.deviceName || 'Unknown Device',
    timestamp,
    location: location
      ? {
          latitude: locationNumber(location.latitude),
          longitude: locationNumber(location.longitude),
          accuracy: locationNumber(location.accuracy),
          altitude: locationNumber(location.altitude),
          speed: locationNumber(location.speed),
        }
      : null,
    gyroscope: data.gyroscope
      ? {
          x: sensorNumber(data.gyroscope.x),
          y: sensorNumber(data.gyroscope.y),
          z: sensorNumber(data.gyroscope.z),
        }
      : null,
    accelerometer: data.accelerometer
      ? {
          x: sensorNumber(data.accelerometer.x),
          y: sensorNumber(data.accelerometer.y),
          z: sensorNumber(data.accelerometer.z),
        }
      : null,
    batteryLevel: sensorNumber(data.batteryLevel),
    isCharging: typeof data.isCharging === 'boolean' ? data.isCharging : null,
    networkType: data.networkType || 'Unknown',
    androidVersion: data.androidVersion || 'Unknown',
    deviceModel: data.deviceModel || 'Unknown model',
    appVersion: data.appVersion || 'Unknown',
  }
}

export function subscribeToUserTelemetry(userId, callback, onError, pageSize) {
  if (!db || !userId) {
    callback([], { lastDocument: null, hasMore: false })
    return () => {}
  }

  const constraints = [
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
  ]
  if (Number.isInteger(pageSize) && pageSize > 0) constraints.push(limit(pageSize))
  const telemetryQuery = query(collection(db, 'telemetry'), ...constraints)

  return onSnapshot(
    telemetryQuery,
    (snapshot) => {
      callback(
        snapshot.docs.map((record) =>
          normalizeTelemetry(record.id, record.data()),
        ),
        {
          lastDocument: snapshot.docs[snapshot.docs.length - 1] || null,
          hasMore: Number.isInteger(pageSize) && snapshot.docs.length === pageSize,
        },
      )
    },
    (error) => onError?.(error),
  )
}

export async function getNextTelemetryPage(userId, lastDocument, pageSize = TELEMETRY_PAGE_SIZE) {
  if (!db || !userId || !lastDocument) {
    return { records: [], lastDocument: null, hasMore: false }
  }

  const telemetryQuery = query(
    collection(db, 'telemetry'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
    startAfter(lastDocument),
    limit(pageSize),
  )
  const snapshot = await getDocs(telemetryQuery)
  const docs = snapshot.docs
  return {
    records: docs.map((record) => normalizeTelemetry(record.id, record.data())),
    lastDocument: docs[docs.length - 1] || null,
    hasMore: docs.length === pageSize,
  }
}

export async function getTelemetryForUser(userId) {
  if (!db || !userId) return []

  const telemetryQuery = query(
    collection(db, 'telemetry'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
  )
  const snapshot = await getDocs(telemetryQuery)
  return snapshot.docs.map((record) => normalizeTelemetry(record.id, record.data()))
}

export async function deleteTelemetryForUser(userId) {
  if (!db || !userId) return

  const telemetryQuery = query(
    collection(db, 'telemetry'),
    where('userId', '==', userId),
  )
  const snapshot = await getDocs(telemetryQuery)
  for (let offset = 0; offset < snapshot.docs.length; offset += 450) {
    const batch = writeBatch(db)
    snapshot.docs.slice(offset, offset + 450).forEach((record) => batch.delete(record.ref))
    await batch.commit()
  }
}

export async function deleteTelemetryRecord(userId, recordId) {
  if (!db || !userId || !recordId) return
  await deleteDoc(doc(db, 'telemetry', recordId))
}
