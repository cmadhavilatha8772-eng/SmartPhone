import { useEffect, useMemo, useState } from 'react'
import {
  BatteryCharging,
  Database,
  MapPin,
  Navigation,
  ShieldCheck,
  Smartphone,
  Wifi,
} from 'lucide-react'
import BatteryChart from '../components/BatteryChart'
import LocationMap from '../components/LocationMap'
import Loading from '../components/Loading'
import SensorChart from '../components/SensorChart'
import StatCard from '../components/StatCard'
import TelemetryTable from '../components/TelemetryTable'
import { subscribeToUserDevices } from '../services/deviceService'
import { subscribeToUserTelemetry } from '../services/telemetryService'

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

export default function Dashboard({ user }) {
  const [telemetry, setTelemetry] = useState([])
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')

  useEffect(() => {
    if (!user) return undefined

    const unwatchTelemetry = subscribeToUserTelemetry(user.uid, (nextTelemetry) => {
      setTelemetry(nextTelemetry)
      setLoading(false)
    })
    const unwatchDevices = subscribeToUserDevices(user.uid, (nextDevices) => {
      setDevices(nextDevices)
    })

    return () => {
      unwatchTelemetry()
      unwatchDevices()
    }
  }, [user])

  const filteredTelemetry = useMemo(() => {
    if (!telemetry.length) return []

    const now = Date.now()
    const windows = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }

    const cutoff = now - (windows[period] || windows['7d'])
    return telemetry.filter((record) => new Date(record.timestamp).getTime() >= cutoff)
  }, [period, telemetry])

  const latestTelemetry = telemetry[0] || null
  const totalDevices = devices.length || 0
  const totalTelemetryRecords = telemetry.length || 0
  const latestSeen = devices.reduce((latest, device) => {
    if (!latest || new Date(device.lastSeen) > new Date(latest)) {
      return device.lastSeen
    }
    return latest
  }, null)

  const latestBattery = latestTelemetry?.batteryLevel ?? devices[0]?.batteryLevel ?? 0
  const collectionEnabled = devices.some((device) => device.collectionEnabled)
  const locationStatus = latestTelemetry?.location?.latitude ? 'ACTIVE' : 'NO LOCATION'

  const batteryHistory = useMemo(
    () =>
      filteredTelemetry
        .slice()
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .slice(-12)
        .map((record) => ({
          label: new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          battery: record.batteryLevel || 0,
        })),
    [filteredTelemetry],
  )

  const sensorHistory = useMemo(
    () =>
      filteredTelemetry
        .slice()
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .slice(-12)
        .map((record) => ({
          label: new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          gx: record.gyroscope?.x || 0,
          gy: record.gyroscope?.y || 0,
          gz: record.gyroscope?.z || 0,
        })),
    [filteredTelemetry],
  )

  if (loading) {
    return <Loading message="Loading dashboard telemetry..." />
  }

  return (
    <div className="page-stack">
      <div className="segmented-control align-left">
        {['24h', '7d', '30d'].map((option) => (
          <button key={option} type="button" className={period === option ? 'active' : ''} onClick={() => setPeriod(option)}>
            {option === '24h' ? '24 hours' : option === '7d' ? '7 days' : '30 days'}
          </button>
        ))}
      </div>

      <section className="stats-grid">
        <StatCard icon={Smartphone} title="Total Devices" value={String(totalDevices)} subtitle="Connected devices" tone="blue" />
        <StatCard icon={Database} title="Total Telemetry Records" value={totalTelemetryRecords.toLocaleString()} subtitle="Collected samples" tone="purple" />
        <StatCard icon={Navigation} title="Last Seen" value={formatRelativeTime(latestSeen)} subtitle="Latest device heartbeat" tone="green" />
        <StatCard icon={BatteryCharging} title="Battery Level" value={`${latestBattery}%`} subtitle="Current device battery" tone="amber" />
        <StatCard icon={ShieldCheck} title="Collection Status" value={collectionEnabled ? 'ACTIVE' : 'IDLE'} subtitle="Data collection" tone="cyan" />
        <StatCard icon={MapPin} title="Location Status" value={locationStatus} subtitle="GPS readiness" tone="red" />
      </section>

      <section className="panel-grid two-column">
        <LocationMap telemetry={telemetry} title="Latest location map" />
        <div className="info-panel">
          <div className="panel-header">
            <h3>Telemetry snapshot</h3>
          </div>
          <div className="info-list">
            <div>
              <span>Latest location</span>
              <strong>
                {latestTelemetry?.location?.latitude && latestTelemetry?.location?.longitude
                  ? `${latestTelemetry.location.latitude.toFixed(4)}, ${latestTelemetry.location.longitude.toFixed(4)}`
                  : 'Awaiting location'}
              </strong>
            </div>
            <div>
              <span>Last update</span>
              <strong>{latestTelemetry ? formatRelativeTime(latestTelemetry.timestamp) : 'No telemetry yet'}</strong>
            </div>
            <div>
              <span>Network</span>
              <strong>{latestTelemetry?.networkType || 'Unknown'}</strong>
            </div>
            <div>
              <span>Runtime</span>
              <strong>{collectionEnabled ? 'ACTIVE' : 'Disabled'}</strong>
            </div>
            <div>
              <span>Device model</span>
              <strong>{latestTelemetry?.deviceModel || devices[0]?.model || 'Unknown'}</strong>
            </div>
            <div>
              <span>Battery</span>
              <strong>{latestBattery}%</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="panel-grid two-column">
        <BatteryChart data={batteryHistory} />
        <SensorChart data={sensorHistory} />
      </section>

      <section className="panel-card">
        <div className="panel-header">
          <h3>Recent telemetry</h3>
          <span className="muted">Latest records</span>
        </div>
        {telemetry.length ? (
          <TelemetryTable records={telemetry.slice(0, 6)} />
        ) : (
          <div className="empty-state">
            No telemetry data available yet. Connect your Android device to start receiving telemetry.
          </div>
        )}
      </section>
    </div>
  )
}
