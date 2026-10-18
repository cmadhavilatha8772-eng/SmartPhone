import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'

const normalizeDevice = (deviceId, data = {}) => ({
  id: deviceId,
  deviceId: data.deviceId || deviceId,
  deviceName: data.deviceName || 'Unnamed Device',
  model: data.model || 'Unknown model',
  androidVersion: data.androidVersion || 'Unknown',
  appVersion: data.appVersion || 'Unknown',
  // Convert Firestore Timestamp values so the UI can format dates consistently.
  lastSeen: data.lastSeen?.toDate ? data.lastSeen.toDate() : data.lastSeen || null,
  collectionEnabled: data.collectionEnabled ?? true,
  batteryLevel: data.batteryLevel ?? 0,
  networkType: data.networkType || 'Unknown',
  userId: data.userId || '',
})

export function subscribeToUserDevices(userId, callback) {
  if (!db || !userId) {
    callback([])
    return () => {}
  }

  // Read only this user's device subcollection and show the most recently seen first.
  const q = query(collection(db, 'users', userId, 'devices'), orderBy('lastSeen', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const devices = snapshot.docs.map((docSnap) => normalizeDevice(docSnap.id, docSnap.data()))
    callback(devices)
  })
}

export async function getDevicesForUser(userId) {
  if (!db || !userId) return []

  const q = query(collection(db, 'users', userId, 'devices'), orderBy('lastSeen', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => normalizeDevice(docSnap.id, docSnap.data()))
}

export async function updateDeviceStatus(userId, deviceId, updates) {
  if (!db || !userId || !deviceId) return

  const deviceRef = doc(db, 'users', userId, 'devices', deviceId)
  await updateDoc(deviceRef, updates)
}

export async function deleteDevice(userId, deviceId) {
  if (!db || !userId || !deviceId) return

  const deviceRef = doc(db, 'users', userId, 'devices', deviceId)
  await deleteDoc(deviceRef)
}
