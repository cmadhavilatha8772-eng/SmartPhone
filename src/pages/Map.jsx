import { useEffect, useMemo, useState } from 'react'
import LocationMap from '../components/LocationMap'
import Loading from '../components/Loading'
import { subscribeToUserTelemetry } from '../services/telemetryService'

const filterByWindow = (records, period) => {
  if (!records.length) return []

  const now = Date.now()
  const windows = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    all: Number.MAX_SAFE_INTEGER,
  }

  const cutoff = now - (windows[period] || windows['7d'])
  return records.filter((record) => new Date(record.timestamp).getTime() >= cutoff)
}

export default function MapPage({ user }) {
  const [telemetry, setTelemetry] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')

  useEffect(() => {
    if (!user) return undefined

    const unsubscribe = subscribeToUserTelemetry(user.uid, (nextTelemetry) => {
      setTelemetry(nextTelemetry)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const filteredTelemetry = useMemo(() => filterByWindow(telemetry, period), [telemetry, period])

  if (loading) {
    return <Loading message="Loading location map..." />
  }

  return (
    <div className="page-stack">
      <div className="panel-card">
        <div className="panel-header">
          <h3>Location history</h3>
          <div className="segmented-control">
            {['24h', '7d', '30d'].map((option) => (
              <button key={option} type="button" className={period === option ? 'active' : ''} onClick={() => setPeriod(option)}>
                {option === '24h' ? 'Last 24 hours' : option === '7d' ? 'Last 7 days' : 'Last 30 days'}
              </button>
            ))}
          </div>
        </div>

        <LocationMap telemetry={filteredTelemetry} showHistory title="Location map history" />
      </div>
    </div>
  )
}
