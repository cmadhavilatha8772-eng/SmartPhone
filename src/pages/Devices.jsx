import { useEffect, useState } from 'react'
import { BatteryCharging, Clock3, Smartphone, Wifi } from 'lucide-react'
import Loading from '../components/Loading'
import useDeviceActivity from '../hooks/useDeviceActivity'
import { subscribeToUserDevices } from '../services/deviceService'

const formatRelativeTime = (date) => {
  if (!date) return 'No data'
  const diffMs = Date.now() - new Date(date).getTime()
  const minutes = Math.max(0, Math.floor(diffMs / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function Devices({ user }) {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const { isDeviceActive, settingsError } = useDeviceActivity(user)

  useEffect(() => {
    if (!user) return undefined

    // Listen for device updates in real time and stop listening when the account changes.
    const unsubscribe = subscribeToUserDevices(user.uid, (nextDevices) => {
      setDevices(nextDevices)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  if (loading) {
    return <Loading message="Loading devices..." />
  }

  if (!devices.length) {
    return (
      <div className="panel-card">
        <div className="empty-state">
          No devices registered yet. Connect your Android app to create the first device entry.
        </div>
      </div>
    )
  }

  return (
    <div className="page-stack">
      {settingsError ? <div className="error-box" role="alert">{settingsError}</div> : null}

      <div className="panel-card">
        <div className="panel-header">
          <h3>Connected devices</h3>
          <span className="muted">{devices.length} total</span>
        </div>

        <div className="device-grid">
          {devices.map((device) => {
            const active = isDeviceActive(device)
            return (
              <article key={device.id} className="device-card">
                <div className="device-topline">
                  <div className="device-icon">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <h4>{device.deviceName}</h4>
                    <p>{device.model}</p>
                  </div>
                </div>

                <div className="device-meta">
                  <div>
                    <span>Android</span>
                    <strong>{device.androidVersion}</strong>
                  </div>
                  <div>
                    <span>App</span>
                    <strong>{device.appVersion}</strong>
                  </div>
                </div>

                <div className="device-stats">
                  <div>
                    <Clock3 size={16} />
                    <span>Last seen</span>
                    <strong>{formatRelativeTime(device.lastSeen)}</strong>
                  </div>
                  <div>
                    <BatteryCharging size={16} />
                    <span>Battery</span>
                    <strong>{device.batteryLevel || 0}%</strong>
                  </div>
                  <div>
                    <Wifi size={16} />
                    <span>Network</span>
                    <strong>{device.networkType || 'Unknown'}</strong>
                  </div>
                </div>

                <div className="device-status-row">
                  <span className={`status-badge ${active ? 'active' : 'inactive'}`}>
                    {active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
