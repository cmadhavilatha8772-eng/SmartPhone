import { useEffect, useState } from 'react'
import { AlertTriangle, Shield, Smartphone, Trash2 } from 'lucide-react'
import { deleteCurrentUserAccount, logoutUser } from '../services/authService'
import { subscribeToUserDevices, updateDeviceStatus } from '../services/deviceService'
import { deleteTelemetryForUser } from '../services/telemetryService'

export default function Settings({ user }) {
  const [devices, setDevices] = useState([])
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    if (!user) return undefined

    const unsubscribe = subscribeToUserDevices(user.uid, setDevices)
    return () => unsubscribe()
  }, [user])

  const toggleCollection = async () => {
    if (!devices.length) return
    const nextValue = !devices.some((device) => device.collectionEnabled)

    await Promise.all(
      devices.map((device) => updateDeviceStatus(user.uid, device.id, { collectionEnabled: nextValue })),
    )

    setStatusMessage(`Collection status set to ${nextValue ? 'enabled' : 'disabled'}.`)
  }

  const handleDeleteTelemetry = async () => {
    const confirmed = window.confirm('Delete all telemetry data for this account? This action cannot be undone.')
    if (!confirmed || !user) return

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
            <label>Default interval</label>
            <input value="15 minutes" readOnly />
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
