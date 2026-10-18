import { useEffect, useState } from 'react'
import { subscribeToUserSettings } from '../services/userSettingsService'

const DEFAULT_INTERVAL_MINUTES = 15
const STATUS_REFRESH_INTERVAL_MS = 30_000

function isDeviceActive(device, now, intervalMinutes) {
  if (!device.collectionEnabled || !device.lastSeen) return false

  const lastSeenTime = new Date(device.lastSeen).getTime()
  const age = now - lastSeenTime
  return Number.isFinite(lastSeenTime) && age >= 0 && age < intervalMinutes * 60_000
}

export default function useDeviceActivity(user) {
  const [now, setNow] = useState(Date.now)
  const [userSettings, setUserSettings] = useState(null)

  useEffect(() => {
    if (!user?.uid) return undefined

    return subscribeToUserSettings(
      user.uid,
      (settings) => {
        const savedInterval = Number(settings.telemetryIntervalMinutes)
        setUserSettings({
          userId: user.uid,
          intervalMinutes:
            Number.isInteger(savedInterval) && savedInterval > 0
              ? savedInterval
              : DEFAULT_INTERVAL_MINUTES,
          error: '',
        })
      },
      (error) => {
        setUserSettings({
          userId: user.uid,
          intervalMinutes: DEFAULT_INTERVAL_MINUTES,
          error: error.message || 'Unable to load telemetry interval.',
        })
      },
    )
  }, [user])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), STATUS_REFRESH_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [])

  const currentSettings =
    userSettings?.userId === user?.uid
      ? userSettings
      : { intervalMinutes: DEFAULT_INTERVAL_MINUTES, error: '' }

  return {
    isDeviceActive: (device) => isDeviceActive(device, now, currentSettings.intervalMinutes),
    settingsError: currentSettings.error,
  }
}
