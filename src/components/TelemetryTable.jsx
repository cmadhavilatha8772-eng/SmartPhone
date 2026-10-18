const formatTimestamp = (value) => {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString([], {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

const formatNumber = (value, digits = 2) =>
  Number.isFinite(value) ? value.toFixed(digits) : '—'

const formatAxes = (values) =>
  values && [values.x, values.y, values.z].every(Number.isFinite)
    ? `${formatNumber(values.x)}, ${formatNumber(values.y)}, ${formatNumber(values.z)}`
    : '—'

export default function TelemetryTable({
  records = [],
  onRowClick,
  loading = false,
  emptyMessage = 'No telemetry data available yet.',
  limit = 10,
}) {
  if (loading) {
    return (
      <div className="table-skeleton">
        <div className="skeleton-row" />
        <div className="skeleton-row" />
        <div className="skeleton-row" />
      </div>
    )
  }

  if (!records.length) {
    return <div className="empty-state">{emptyMessage}</div>
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Record ID</th>
            <th>Timestamp</th>
            <th>User ID</th>
            <th>Device</th>
            <th>Device ID</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Accuracy</th>
            <th>Altitude</th>
            <th>Speed</th>
            <th>Gyro</th>
            <th>Accel</th>
            <th>Battery</th>
            <th>Charging</th>
            <th>Network</th>
            <th>Android</th>
            <th>Model</th>
            <th>App version</th>
          </tr>
        </thead>
        <tbody>
          {(limit === null ? records : records.slice(0, limit)).map((record) => (
            <tr key={record.id} onClick={() => onRowClick?.(record)} className={onRowClick ? 'clickable-row' : ''}>
              <td>{record.id || '—'}</td>
              <td>{formatTimestamp(record.timestamp)}</td>
              <td>{record.userId || '—'}</td>
              <td>{record.deviceName || record.deviceModel || 'Unknown device'}</td>
              <td>{record.deviceId || '—'}</td>
              <td>{record.location?.latitude ?? '—'}</td>
              <td>{record.location?.longitude ?? '—'}</td>
              <td>{Number.isFinite(record.location?.accuracy) ? `${formatNumber(record.location.accuracy, 1)} m` : '—'}</td>
              <td>{Number.isFinite(record.location?.altitude) ? `${formatNumber(record.location.altitude, 1)} m` : '—'}</td>
              <td>{Number.isFinite(record.location?.speed) ? `${formatNumber(record.location.speed, 1)} m/s` : '—'}</td>
              <td>{formatAxes(record.gyroscope)}</td>
              <td>{formatAxes(record.accelerometer)}</td>
              <td>{Number.isFinite(record.batteryLevel) ? `${record.batteryLevel}%` : '—'}</td>
              <td>{typeof record.isCharging === 'boolean' ? (record.isCharging ? 'Yes' : 'No') : '—'}</td>
              <td>{record.networkType || 'Unknown'}</td>
              <td>{record.androidVersion || 'Unknown'}</td>
              <td>{record.deviceModel || 'Unknown'}</td>
              <td>{record.appVersion || 'Unknown'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
