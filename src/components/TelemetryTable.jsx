const formatTimestamp = (value) => {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString([], {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default function TelemetryTable({ records = [], onRowClick, loading = false, emptyMessage = 'No telemetry data available yet.' }) {
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
            <th>Timestamp</th>
            <th>Device</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Accuracy</th>
            <th>Gyro</th>
            <th>Accel</th>
            <th>Battery</th>
            <th>Charging</th>
            <th>Network</th>
          </tr>
        </thead>
        <tbody>
          {records.slice(0, 10).map((record) => (
            <tr key={record.id} onClick={() => onRowClick?.(record)} className={onRowClick ? 'clickable-row' : ''}>
              <td>{formatTimestamp(record.timestamp)}</td>
              <td>{record.deviceName || record.deviceModel || 'Unknown device'}</td>
              <td>{record.location?.latitude ?? '—'}</td>
              <td>{record.location?.longitude ?? '—'}</td>
              <td>{record.location?.accuracy ? `${record.location.accuracy.toFixed(1)} m` : '—'}</td>
              <td>{record.gyroscope ? `${record.gyroscope.x.toFixed(2)}, ${record.gyroscope.y.toFixed(2)}, ${record.gyroscope.z.toFixed(2)}` : '—'}</td>
              <td>{record.accelerometer ? `${record.accelerometer.x.toFixed(2)}, ${record.accelerometer.y.toFixed(2)}, ${record.accelerometer.z.toFixed(2)}` : '—'}</td>
              <td>{record.batteryLevel ? `${record.batteryLevel}%` : '—'}</td>
              <td>{record.isCharging ? 'Yes' : 'No'}</td>
              <td>{record.networkType || 'Unknown'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
