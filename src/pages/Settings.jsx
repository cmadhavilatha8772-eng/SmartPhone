import { useEffect, useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { deleteCurrentUserAccount, logoutUser } from '../services/authService'
import { subscribeToUserDevices, updateDeviceStatus } from '../services/deviceService'
import { deleteTelemetryForUser } from '../services/telemetryService'
import { subscribeToUserSettings, updateTelemetryInterval } from '../services/userSettingsService'

const PRESET_INTERVALS = [1, 5, 15, 30, 60]
const DEFAULT_INTERVAL = 15

export default function Settings({ user }) {
  const [devices, setDevices] = useState([])
  const [statusMessage, setStatusMessage] = useState('')
  const [intervalChoice, setIntervalChoice] = useState(String(DEFAULT_INTERVAL))
  const [customInterval, setCustomInterval] = useState(String(DEFAULT_INTERVAL))
  const [savedInterval, setSavedInterval] = useState(DEFAULT_INTERVAL)
  const [intervalLoaded, setIntervalLoaded] = useState(false)
  const [intervalSaving, setIntervalSaving] = useState(false)
  const [intervalMessage, setIntervalMessage] = useState('')
  const [intervalError, setIntervalError] = useState(false)

  useEffect(() => {
    if (!user) return undefined

    const unsubscribe = subscribeToUserDevices(user.uid, setDevices)
    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    if (!user) return undefined

    const unsubscribe = subscribeToUserSettings(
      user.uid,
      (settings) => {
        const savedValue = Number(settings.telemetryIntervalMinutes)
        const interval = Number.isInteger(savedValue) && savedValue > 0 ? savedValue : DEFAULT_INTERVAL
        setSavedInterval(interval)
        setCustomInterval(String(interval))
        setIntervalChoice(PRESET_INTERVALS.includes(interval) ? String(interval) : 'custom')
        setIntervalLoaded(true)
      },
      (error) => {
        setIntervalMessage(error.message || 'Unable to load telemetry interval.')
        setIntervalError(true)
        setIntervalLoaded(true)
      },
    )
    return () => unsubscribe()
  }, [user])

  const selectedInterval = intervalChoice === 'custom' ? Number(customInterval) : Number(intervalChoice)
  const validInterval = Number.isInteger(selectedInterval) && selectedInterval > 0

  const saveTelemetryInterval = async () => {
    if (!validInterval || !user) return

    setIntervalSaving(true)
    setIntervalMessage('')
    setIntervalError(false)
    try {
      await updateTelemetryInterval(user.uid, selectedInterval)
      setSavedInterval(selectedInterval)
      setIntervalMessage(`Upload interval saved: every ${selectedInterval} minute${selectedInterval === 1 ? '' : 's'}.`)
    } catch (error) {
      setIntervalMessage(error.message || 'Unable to save telemetry interval.')
      setIntervalError(true)
    } finally {
      setIntervalSaving(false)
    }
  }

  const toggleCollection = async () => {
    if (!devices.length) return
    // Apply one consistent collection state to every device on this account.
    const nextValue = !devices.some((device) => device.collectionEnabled)

    await Promise.all(
      devices.map((device) => updateDeviceStatus(user.uid, device.id, { collectionEnabled: nextValue })),
    )

    setStatusMessage(`Collection status set to ${nextValue ? 'enabled' : 'disabled'}.`)
  }

  const handleDeleteTelemetry = async () => {
    const confirmed = window.confirm('Delete all telemetry data for this account? This action cannot be undone.')
    if (!confirmed || !user) return

    // The service deletes matching records across every device telemetry subcollection.
    await deleteTelemetryForUser(user.uid)
    setStatusMessage('Telemetry data has been deleted.')
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Delete your account permanently? This will remove your Firebase auth record and all related telemetry access.')
    if (!confirmed || !user) return

    try {
      await deleteCurrentUserAccount()
      await logoutUser()
      setStatusMessage('Account deleted.')
    } catch (error) {
      setStatusMessage(error.message || 'Unable to delete account right now.')
    }
  }

  return (
    <div className="page-stack">
      <div className="panel-card">
        <div className="panel-header">
          <h3>Account</h3>
        </div>

        <div className="settings-grid">
          <div className="settings-item">
            <label>Display name</label>
            <input value={user?.displayName || 'User'} readOnly />
          </div>
          <div className="settings-item">
            <label>Email</label>
            <input value={user?.email || 'No email'} readOnly />
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <h3>Telemetry settings</h3>
        </div>

        <div className="settings-grid">
          <div className="settings-item switch-row">
            <div>
              <label>Collection status</label>
              <small>{devices.some((device) => device.collectionEnabled) ? 'Collection is enabled' : 'Collection is paused'}</small>
            </div>
            <button type="button" className="secondary-button" onClick={toggleCollection}>
              {devices.some((device) => device.collectionEnabled) ? 'Pause collection' : 'Enable collection'}
            </button>
          </div>
          <div className="settings-item">
            <label htmlFor="telemetry-interval">Upload interval</label>
            <select
              id="telemetry-interval"
              value={intervalChoice}
              onChange={(event) => setIntervalChoice(event.target.value)}
              disabled={!intervalLoaded || intervalSaving}
            >
              {PRESET_INTERVALS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  Every {minutes} minute{minutes === 1 ? '' : 's'}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
            {intervalChoice === 'custom' ? (
              <input
                aria-label="Custom upload interval in minutes"
                type="number"
                min="1"
                step="1"
                value={customInterval}
                onChange={(event) => setCustomInterval(event.target.value)}
                disabled={!intervalLoaded || intervalSaving}
              />
            ) : null}
            <small>Choose a preset or enter a custom number of minutes.</small>
            <button
              type="button"
              className="secondary-button"
              onClick={saveTelemetryInterval}
              disabled={!intervalLoaded || !validInterval || intervalSaving || selectedInterval === savedInterval}
            >
              {intervalSaving ? 'Saving...' : 'Save interval'}
            </button>
            {intervalMessage ? (
              <div className={intervalError ? 'error-box' : 'success-box'} role={intervalError ? 'alert' : 'status'}>
                {intervalMessage}
              </div>
            ) : null}
          </div>
          <div className="settings-item">
            <label>Data retention</label>
            <input value="90 days" readOnly />
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <h3>Privacy</h3>
        </div>
        <div className="privacy-block">
          <p>
            The future Android app will collect the following data from your device and write it into Firestore under your own user account:
          </p>
          <ul>
            <li>GPS location, latitude, longitude, accuracy, altitude and speed</li>
            <li>Gyroscope X/Y/Z and accelerometer X/Y/Z</li>
            <li>Battery percentage and charging status</li>
            <li>Network type, Android version, device model, app version</li>
            <li>Timestamp for every telemetry upload</li>
          </ul>
        </div>
      </div>

      <div className="panel-card danger-panel">
        <div className="panel-header">
          <h3>Danger zone</h3>
        </div>

        <div className="danger-actions">
          <button type="button" className="danger-button" onClick={handleDeleteTelemetry}>
            <Trash2 size={16} />
            Delete telemetry data
          </button>
          <button type="button" className="danger-button alt" onClick={handleDeleteAccount}>
            <AlertTriangle size={16} />
            Delete account
          </button>
        </div>

        {statusMessage ? <div className="success-box">{statusMessage}</div> : null}
      </div>
    </div>
  )
}
